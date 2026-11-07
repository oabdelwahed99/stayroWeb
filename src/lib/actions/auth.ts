"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { OwnerProfile } from "@/models/OwnerProfile";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import {
  sendEmail,
  verificationEmailHtml,
  resetPasswordEmailHtml,
} from "@/lib/email";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function registerOwner(input: unknown) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "validation", issues: parsed.error.flatten() };
  }

  const { name, email, phone, password, locale } = parsed.data;
  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return { ok: false as const, error: "emailExists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const token = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role: "owner",
    locale,
    emailVerified: null,
    emailVerifyToken: token,
    emailVerifyExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });

  await OwnerProfile.create({
    userId: user._id,
    verificationStatus: "pending",
  });

  const verifyUrl = `${appUrl()}/${locale}/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: locale === "ar" ? "تأكيد بريدك - ستيرو" : "Verify your email - Stayro",
    html: verificationEmailHtml(user.name, verifyUrl, locale),
  });

  return { ok: true as const };
}

export async function verifyEmailToken(token: string) {
  await connectDB();
  const user = await User.findOne({
    emailVerifyToken: token,
    emailVerifyExpires: { $gt: new Date() },
  });

  if (!user) return { ok: false as const, error: "invalid" };

  user.emailVerified = new Date();
  user.emailVerifyToken = null;
  user.emailVerifyExpires = null;
  await user.save();

  return { ok: true as const };
}

export async function requestPasswordReset(input: unknown) {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "validation" };
  }

  await connectDB();
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });

  // Always return ok to avoid email enumeration
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60);
    await user.save();

    const url = `${appUrl()}/${user.locale}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: user.locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset your password",
      html: resetPasswordEmailHtml(user.name, url, user.locale),
    });
  }

  return { ok: true as const };
}

export async function resetPassword(input: unknown) {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "validation" };
  }

  await connectDB();
  const user = await User.findOne({
    resetPasswordToken: parsed.data.token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) return { ok: false as const, error: "invalid" };

  user.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { ok: true as const };
}
