import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  locale: z.enum(["ar", "en"]).optional(),
});

export const verificationSchema = z.object({
  idType: z.enum(["national_id", "iqama", "passport"]),
  idNumber: z.string().min(5).max(30),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });
