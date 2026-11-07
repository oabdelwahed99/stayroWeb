"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { User } from "@/models/User";
import { OwnerProfile } from "@/models/OwnerProfile";
import {
  profileUpdateSchema,
  verificationSchema,
  changePasswordSchema,
} from "@/lib/validations/profile";

export async function updateProfile(input: unknown) {
  const session = await requireSession();
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "validation" };

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    name: parsed.data.name,
    phone: parsed.data.phone,
    ...(parsed.data.locale ? { locale: parsed.data.locale } : {}),
  });

  revalidatePath("/dashboard/profile");
  return { ok: true as const };
}

export async function submitVerification(input: unknown) {
  const session = await requireSession();
  const parsed = verificationSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "validation" };

  await connectDB();
  await OwnerProfile.findOneAndUpdate(
    { userId: session.user.id },
    {
      idType: parsed.data.idType,
      idNumber: parsed.data.idNumber,
      verificationStatus: "pending",
      rejectionReason: undefined,
    },
    { upsert: true }
  );

  revalidatePath("/dashboard/profile");
  return { ok: true as const };
}

export async function changePassword(input: unknown) {
  const session = await requireSession();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "validation" };

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) return { ok: false as const, error: "notFound" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { ok: false as const, error: "wrongPassword" };

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await user.save();
  return { ok: true as const };
}

export async function getProfileData() {
  const session = await requireSession();
  await connectDB();
  const [user, profile] = await Promise.all([
    User.findById(session.user.id).select("-passwordHash").lean(),
    OwnerProfile.findOne({ userId: session.user.id }).lean(),
  ]);
  return JSON.parse(JSON.stringify({ user, profile }));
}
