import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Unit } from "@/models/Unit";

export type PublicUnit = {
  id: string;
  type?: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  city?: string;
  district?: string;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  areaM2?: number;
  amenities: string[];
  houseRules?: string;
  checkInTime?: string;
  checkOutTime?: string;
  photoIds: string[];
  pricing: {
    nightly: number;
    weekend?: number;
    cleaningFee?: number;
    minNights: number;
  };
};

const PUBLIC_FIELDS =
  "type title description city district guests bedrooms beds bathrooms areaM2 amenities houseRules checkInTime checkOutTime photos pricing";

type LeanUnit = {
  _id: mongoose.Types.ObjectId;
  type?: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  city?: string;
  district?: string;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  areaM2?: number;
  amenities: string[];
  houseRules?: string;
  checkInTime?: string;
  checkOutTime?: string;
  photos: { fileId: mongoose.Types.ObjectId; order: number; isCover: boolean }[];
  pricing: { nightly: number; weekend?: number; cleaningFee?: number; minNights: number };
};

function toPublic(u: LeanUnit): PublicUnit {
  const photos = [...u.photos].sort(
    (a, b) => Number(b.isCover) - Number(a.isCover) || a.order - b.order
  );
  return {
    id: String(u._id),
    type: u.type,
    title: u.title,
    description: u.description,
    city: u.city,
    district: u.district,
    guests: u.guests,
    bedrooms: u.bedrooms,
    beds: u.beds,
    bathrooms: u.bathrooms,
    areaM2: u.areaM2,
    amenities: u.amenities ?? [],
    houseRules: u.houseRules,
    checkInTime: u.checkInTime,
    checkOutTime: u.checkOutTime,
    photoIds: photos.map((p) => String(p.fileId)),
    pricing: {
      nightly: u.pricing?.nightly ?? 0,
      weekend: u.pricing?.weekend,
      cleaningFee: u.pricing?.cleaningFee,
      minNights: u.pricing?.minNights ?? 1,
    },
  };
}

export async function getPublishedUnits(limit?: number): Promise<PublicUnit[]> {
  try {
    await connectDB();
    const query = Unit.find({ status: "published", "photos.0": { $exists: true } })
      .select(PUBLIC_FIELDS)
      .sort({ updatedAt: -1 });
    if (limit) query.limit(limit);
    const units = (await query.lean()) as unknown as LeanUnit[];
    return units.map(toPublic);
  } catch (err) {
    console.error("getPublishedUnits failed", err);
    return [];
  }
}

export async function getPublishedUnit(id: string): Promise<PublicUnit | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const unit = (await Unit.findOne({ _id: id, status: "published" })
    .select(PUBLIC_FIELDS)
    .lean()) as unknown as LeanUnit | null;
  return unit ? toPublic(unit) : null;
}

export function localized(value: { ar: string; en: string }, locale: string) {
  return locale === "ar" ? value.ar || value.en : value.en || value.ar;
}
