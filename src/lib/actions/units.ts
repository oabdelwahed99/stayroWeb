"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { Unit } from "@/models/Unit";
import { unitDraftSchema, unitSubmitSchema } from "@/lib/validations/unit";
import { deleteImage } from "@/lib/gridfs";

export async function createDraftUnit() {
  const session = await requireSession();
  await connectDB();

  const unit = await Unit.create({
    ownerId: session.user.id,
    status: "draft",
    title: { ar: "", en: "" },
    description: { ar: "", en: "" },
    amenities: [],
    photos: [],
    pricing: { nightly: 0, cleaningFee: 0, currency: "SAR", minNights: 1 },
    blockedDates: [],
  });

  return { ok: true as const, id: unit._id.toString() };
}

export async function updateUnitDraft(unitId: string, input: unknown) {
  const session = await requireSession();
  const parsed = unitDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "validation", issues: parsed.error.flatten() };
  }

  await connectDB();
  const unit = await Unit.findOne({ _id: unitId, ownerId: session.user.id });
  if (!unit) return { ok: false as const, error: "notFound" };
  if (!["draft", "rejected", "unlisted", "published"].includes(unit.status)) {
    // allow editing published as draft-like updates that stay published until unlist
  }

  Object.assign(unit, parsed.data);
  if (unit.status === "rejected") {
    // keep rejected until resubmit
  }
  await unit.save();
  revalidatePath(`/dashboard/units`);
  return { ok: true as const };
}

export async function submitUnitForReview(unitId: string) {
  const session = await requireSession();
  await connectDB();

  const unit = await Unit.findOne({ _id: unitId, ownerId: session.user.id });
  if (!unit) return { ok: false as const, error: "notFound" };

  const check = unitSubmitSchema.safeParse({
    type: unit.type,
    title: unit.title,
    description: unit.description,
    city: unit.city,
    district: unit.district,
    address: unit.address,
    location: unit.location,
    guests: unit.guests,
    bedrooms: unit.bedrooms,
    beds: unit.beds,
    bathrooms: unit.bathrooms,
    pricing: unit.pricing,
    photos: unit.photos,
  });

  if (!check.success) {
    return { ok: false as const, error: "missingRequired", issues: check.error.flatten() };
  }

  unit.status = "pending_review";
  unit.rejectionReason = undefined;
  await unit.save();
  revalidatePath(`/dashboard/units`);
  return { ok: true as const };
}

export async function unlistUnit(unitId: string) {
  const session = await requireSession();
  await connectDB();
  const unit = await Unit.findOne({ _id: unitId, ownerId: session.user.id });
  if (!unit) return { ok: false as const, error: "notFound" };
  if (unit.status !== "published") return { ok: false as const, error: "invalidStatus" };
  unit.status = "unlisted";
  await unit.save();
  revalidatePath(`/dashboard/units`);
  return { ok: true as const };
}

export async function deleteUnitPhoto(unitId: string, fileId: string) {
  const session = await requireSession();
  await connectDB();
  const unit = await Unit.findOne({ _id: unitId, ownerId: session.user.id });
  if (!unit) return { ok: false as const, error: "notFound" };

  const photo = unit.photos.find((p) => String(p.fileId) === fileId);
  if (!photo) return { ok: false as const, error: "notFound" };

  unit.photos = unit.photos.filter((p) => String(p.fileId) !== fileId);
  if (photo.isCover && unit.photos.length) {
    unit.photos[0].isCover = true;
  }
  await unit.save();
  await deleteImage(fileId);
  if (photo.thumbId) await deleteImage(String(photo.thumbId));
  revalidatePath(`/dashboard/units/${unitId}/edit`);
  return { ok: true as const };
}

export async function reorderUnitPhotos(
  unitId: string,
  orderedIds: string[],
  coverId?: string
) {
  const session = await requireSession();
  await connectDB();
  const unit = await Unit.findOne({ _id: unitId, ownerId: session.user.id });
  if (!unit) return { ok: false as const, error: "notFound" };

  const map = new Map(unit.photos.map((p) => [String(p.fileId), p]));
  unit.photos = orderedIds
    .map((id, index) => {
      const photo = map.get(id);
      if (!photo) return null;
      return {
        fileId: photo.fileId,
        thumbId: photo.thumbId,
        order: index,
        isCover: coverId ? id === coverId : index === 0,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
  await unit.save();
  revalidatePath(`/dashboard/units/${unitId}/edit`);
  return { ok: true as const };
}

export async function setCoverPhoto(unitId: string, fileId: string) {
  const session = await requireSession();
  await connectDB();
  const unit = await Unit.findOne({ _id: unitId, ownerId: session.user.id });
  if (!unit) return { ok: false as const, error: "notFound" };

  unit.photos.forEach((p) => {
    p.isCover = String(p.fileId) === fileId;
  });
  await unit.save();
  revalidatePath(`/dashboard/units/${unitId}/edit`);
  return { ok: true as const };
}

export async function toggleBlockedDate(unitId: string, date: string) {
  const session = await requireSession();
  await connectDB();
  const unit = await Unit.findOne({ _id: unitId, ownerId: session.user.id });
  if (!unit) return { ok: false as const, error: "notFound" };

  if (unit.blockedDates.includes(date)) {
    unit.blockedDates = unit.blockedDates.filter((d) => d !== date);
  } else {
    unit.blockedDates.push(date);
  }
  await unit.save();
  revalidatePath(`/dashboard/units/${unitId}/calendar`);
  return { ok: true as const, blockedDates: unit.blockedDates };
}

export async function getOwnerUnits() {
  const session = await requireSession();
  await connectDB();
  const units = await Unit.find({ ownerId: session.user.id }).sort({ updatedAt: -1 }).lean();
  return JSON.parse(JSON.stringify(units));
}

export async function getUnitForOwner(unitId: string) {
  const session = await requireSession();
  if (!mongoose.Types.ObjectId.isValid(unitId)) return null;
  await connectDB();
  const unit = await Unit.findOne({ _id: unitId, ownerId: session.user.id }).lean();
  return unit ? JSON.parse(JSON.stringify(unit)) : null;
}
