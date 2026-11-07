"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PayoutMethod } from "@/models/PayoutMethod";
import { PayoutRequest } from "@/models/PayoutRequest";
import { Transaction } from "@/models/Transaction";
import { payoutMethodSchema, payoutRequestSchema } from "@/lib/validations/payout";
import { getPayoutProvider } from "@/lib/payouts";
import { getOwnerBalance } from "@/lib/balance";
import { maskIban } from "@/lib/utils";

export async function addPayoutMethod(input: unknown) {
  const session = await requireSession();
  const parsed = payoutMethodSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "validation", issues: parsed.error.flatten() };
  }

  const provider = getPayoutProvider();
  const validation = await provider.validateBankAccount(parsed.data);
  if (!validation.valid) {
    return { ok: false as const, error: "invalidIban", message: validation.message };
  }

  await connectDB();
  const count = await PayoutMethod.countDocuments({ ownerId: session.user.id });
  const isDefault = parsed.data.isDefault ?? count === 0;

  if (isDefault) {
    await PayoutMethod.updateMany({ ownerId: session.user.id }, { isDefault: false });
  }

  const method = await PayoutMethod.create({
    ownerId: session.user.id,
    bankName: parsed.data.bankName,
    accountHolder: parsed.data.accountHolder,
    iban: parsed.data.iban,
    ibanMasked: maskIban(parsed.data.iban),
    isDefault,
  });

  revalidatePath("/dashboard/payouts");
  return { ok: true as const, id: method._id.toString() };
}

export async function setDefaultPayoutMethod(methodId: string) {
  const session = await requireSession();
  await connectDB();
  const method = await PayoutMethod.findOne({ _id: methodId, ownerId: session.user.id });
  if (!method) return { ok: false as const, error: "notFound" };

  await PayoutMethod.updateMany({ ownerId: session.user.id }, { isDefault: false });
  method.isDefault = true;
  await method.save();
  revalidatePath("/dashboard/payouts");
  return { ok: true as const };
}

export async function deletePayoutMethod(methodId: string) {
  const session = await requireSession();
  await connectDB();
  const method = await PayoutMethod.findOneAndDelete({
    _id: methodId,
    ownerId: session.user.id,
  });
  if (!method) return { ok: false as const, error: "notFound" };

  if (method.isDefault) {
    const next = await PayoutMethod.findOne({ ownerId: session.user.id });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
  revalidatePath("/dashboard/payouts");
  return { ok: true as const };
}

export async function requestPayout(input: unknown) {
  const session = await requireSession();
  const parsed = payoutRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "validation" };
  }

  await connectDB();
  const method = await PayoutMethod.findOne({
    _id: parsed.data.payoutMethodId,
    ownerId: session.user.id,
  });
  if (!method) return { ok: false as const, error: "notFound" };

  const balance = await getOwnerBalance(session.user.id);
  if (parsed.data.amount > balance) {
    return { ok: false as const, error: "insufficient" };
  }

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  try {
    const [payoutReq] = await PayoutRequest.create(
      [
        {
          ownerId: session.user.id,
          amount: parsed.data.amount,
          payoutMethodId: method._id,
          status: "requested",
        },
      ],
      { session: mongoSession }
    );

    const provider = getPayoutProvider();
    const result = await provider.createPayout({
      amount: parsed.data.amount,
      currency: "SAR",
      iban: method.iban,
      accountHolder: method.accountHolder,
      reference: payoutReq._id.toString(),
    });

    payoutReq.status = result.status === "paid" ? "paid" : "processing";
    payoutReq.providerRef = result.providerRef;
    await payoutReq.save({ session: mongoSession });

    await Transaction.create(
      [
        {
          ownerId: session.user.id,
          type: "payout",
          amount: -parsed.data.amount,
          status: result.status === "failed" ? "failed" : "completed",
          reference: result.providerRef,
          description: "Payout request",
          payoutRequestId: payoutReq._id,
        },
      ],
      { session: mongoSession }
    );

    if (result.status === "failed") {
      payoutReq.status = "failed";
      payoutReq.failureReason = result.message;
      await payoutReq.save({ session: mongoSession });
      await mongoSession.abortTransaction();
      return { ok: false as const, error: "providerFailed", message: result.message };
    }

    await mongoSession.commitTransaction();
    revalidatePath("/dashboard/payouts");
    return { ok: true as const, id: payoutReq._id.toString() };
  } catch (e) {
    await mongoSession.abortTransaction();
    console.error(e);
    return { ok: false as const, error: "server" };
  } finally {
    mongoSession.endSession();
  }
}

export async function getPayoutData() {
  const session = await requireSession();
  await connectDB();
  const [balance, methods, transactions, requests] = await Promise.all([
    getOwnerBalance(session.user.id),
    PayoutMethod.find({ ownerId: session.user.id }).sort({ isDefault: -1 }).lean(),
    Transaction.find({ ownerId: session.user.id }).sort({ createdAt: -1 }).limit(50).lean(),
    PayoutRequest.find({ ownerId: session.user.id }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  return JSON.parse(
    JSON.stringify({
      balance,
      methods: methods.map((m) => ({
        ...m,
        iban: undefined,
      })),
      transactions,
      requests,
    })
  );
}
