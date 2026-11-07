import { z } from "zod";

const saIbanRegex = /^SA\d{22}$/i;

export const payoutMethodSchema = z.object({
  bankName: z.string().min(2).max(100),
  accountHolder: z.string().min(2).max(120),
  iban: z
    .string()
    .transform((v) => v.replace(/\s/g, "").toUpperCase())
    .refine((v) => saIbanRegex.test(v), { message: "invalidIban" }),
  isDefault: z.boolean().optional(),
});

export const payoutRequestSchema = z.object({
  amount: z.number().min(50),
  payoutMethodId: z.string().min(1),
});
