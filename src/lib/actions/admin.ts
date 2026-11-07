"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Unit } from "@/models/Unit";
import { OwnerProfile } from "@/models/OwnerProfile";
import { User } from "@/models/User";
import { PayoutRequest } from "@/models/PayoutRequest";
import { Transaction } from "@/models/Transaction";
import { getPayoutProvider } from "@/lib/payouts";

export async function approveUnit(unitId: string) {
  await requireAdmin();
  await connectDB();
  const unit = await Unit.findById(unitId);
  if (!unit) return { ok: false as const, error: "notFound" };
  unit.status = "published";
  unit.rejectionReason = undefined;
  await unit.save();
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function rejectUnit(unitId: string, reason: string) {
  await requireAdmin();
  await connectDB();
  const unit = await Unit.findById(unitId);
  if (!unit) return { ok: false as const, error: "notFound" };
  unit.status = "rejected";
  unit.rejectionReason = reason || "Rejected by admin";
  await unit.save();
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function verifyOwner(profileId: string) {
  await requireAdmin();
  await connectDB();
  await OwnerProfile.findByIdAndUpdate(profileId, {
    verificationStatus: "verified",
    rejectionReason: undefined,
  });
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function rejectOwner(profileId: string, reason: string) {
  await requireAdmin();
  await connectDB();
  await OwnerProfile.findByIdAndUpdate(profileId, {
    verificationStatus: "rejected",
    rejectionReason: reason || "Rejected",
  });
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function addEarning(input: {
  ownerId: string;
  unitId?: string;
  amount: number;
  description?: string;
}) {
  await requireAdmin();
  await connectDB();
  if (!input.amount || input.amount <= 0) return { ok: false as const, error: "invalid" };

  await Transaction.create({
    ownerId: input.ownerId,
    unitId: input.unitId || null,
    type: "booking_earning",
    amount: input.amount,
    status: "completed",
    description: input.description || "Admin added earning",
    reference: `adj_${Date.now()}`,
  });

  revalidatePath("/admin");
  return { ok: true as const };
}

export async function updatePayoutStatus(
  requestId: string,
  status: "processing" | "paid" | "failed",
  failureReason?: string
) {
  await requireAdmin();
  await connectDB();
  const req = await PayoutRequest.findById(requestId);
  if (!req) return { ok: false as const, error: "notFound" };

  if (req.providerRef && status === "processing") {
    const provider = getPayoutProvider();
    const remote = await provider.getPayoutStatus(req.providerRef);
    if (remote.status === "paid") status = "paid";
    if (remote.status === "failed") {
      status = "failed";
      failureReason = remote.message;
    }
  }

  req.status = status;
  if (failureReason) req.failureReason = failureReason;
  await req.save();

  if (status === "failed") {
    // refund ledger
    await Transaction.create({
      ownerId: req.ownerId,
      type: "adjustment",
      amount: req.amount,
      status: "completed",
      description: "Payout failed - refunded to balance",
      payoutRequestId: req._id,
      reference: `refund_${req._id}`,
    });
  }

  revalidatePath("/admin");
  return { ok: true as const };
}

export async function getAdminData() {
  await requireAdmin();
  await connectDB();

  const [units, profiles, payouts, owners] = await Promise.all([
    Unit.find({ status: "pending_review" }).sort({ updatedAt: -1 }).lean(),
    OwnerProfile.find({ verificationStatus: "pending", idNumber: { $exists: true, $ne: "" } })
      .sort({ updatedAt: -1 })
      .lean(),
    PayoutRequest.find({ status: { $in: ["requested", "processing"] } })
      .sort({ createdAt: -1 })
      .lean(),
    User.find({ role: "owner" }).select("name email").lean(),
  ]);

  type LeanOwner = { _id: { toString(): string }; name: string; email: string };
  const ownerList = owners as unknown as LeanOwner[];
  const ownerMap = Object.fromEntries(ownerList.map((o) => [o._id.toString(), o]));

  return JSON.parse(
    JSON.stringify({
      units: (units as unknown as Array<{ ownerId: { toString(): string } }>).map((u) => ({
        ...u,
        owner: ownerMap[u.ownerId.toString()],
      })),
      profiles: (profiles as unknown as Array<{ userId: { toString(): string } }>).map((p) => ({
        ...p,
        owner: ownerMap[p.userId.toString()],
      })),
      payouts: (payouts as unknown as Array<{ ownerId: { toString(): string } }>).map((p) => ({
        ...p,
        owner: ownerMap[p.ownerId.toString()],
      })),
      owners: ownerList,
    })
  );
}
