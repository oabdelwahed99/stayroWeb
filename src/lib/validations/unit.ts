import { z } from "zod";
import { AMENITIES, UNIT_TYPES } from "@/lib/constants/unit";

export const unitDraftSchema = z.object({
  type: z.enum(UNIT_TYPES).optional(),
  title: z
    .object({
      ar: z.string().max(120).optional().default(""),
      en: z.string().max(120).optional().default(""),
    })
    .optional(),
  description: z
    .object({
      ar: z.string().max(5000).optional().default(""),
      en: z.string().max(5000).optional().default(""),
    })
    .optional(),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  address: z.string().max(300).optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  guests: z.number().int().min(1).max(50).optional(),
  bedrooms: z.number().int().min(0).max(50).optional(),
  beds: z.number().int().min(0).max(50).optional(),
  bathrooms: z.number().min(0).max(50).optional(),
  areaM2: z.number().min(0).max(100000).optional(),
  amenities: z.array(z.enum(AMENITIES)).optional(),
  houseRules: z.string().max(5000).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  pricing: z
    .object({
      nightly: z.number().min(0).optional(),
      weekend: z.number().min(0).optional(),
      cleaningFee: z.number().min(0).optional(),
      currency: z.literal("SAR").optional(),
      minNights: z.number().int().min(1).max(365).optional(),
    })
    .optional(),
  tourismLicenseNumber: z.string().max(50).optional(),
});

export const unitSubmitSchema = z.object({
  type: z.enum(UNIT_TYPES),
  title: z.object({
    ar: z.string().min(3).max(120),
    en: z.string().min(3).max(120),
  }),
  description: z.object({
    ar: z.string().min(20).max(5000),
    en: z.string().min(20).max(5000),
  }),
  city: z.string().min(2).max(100),
  district: z.string().min(1).max(100),
  address: z.string().min(3).max(300),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  guests: z.number().int().min(1),
  bedrooms: z.number().int().min(0),
  beds: z.number().int().min(0),
  bathrooms: z.number().min(0),
  pricing: z.object({
    nightly: z.number().min(1),
    weekend: z.number().min(0).optional(),
    cleaningFee: z.number().min(0).optional(),
    currency: z.literal("SAR"),
    minNights: z.number().int().min(1),
  }),
  photos: z.array(z.any()).min(1),
});
