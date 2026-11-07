import mongoose, { Schema, models, model, type Model, type HydratedDocument } from "mongoose";
import { AMENITIES, UNIT_TYPES, type Amenity, type UnitType } from "../lib/constants/unit";

export { AMENITIES, UNIT_TYPES, type Amenity, type UnitType };

export type UnitStatus = "draft" | "pending_review" | "published" | "rejected" | "unlisted";

export interface IUnitPhoto {
  fileId: mongoose.Types.ObjectId;
  thumbId?: mongoose.Types.ObjectId;
  order: number;
  isCover: boolean;
}

export interface IUnit {
  ownerId: mongoose.Types.ObjectId;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  type?: UnitType;
  city?: string;
  district?: string;
  address?: string;
  location?: { lat: number; lng: number };
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  areaM2?: number;
  amenities: Amenity[];
  houseRules?: string;
  checkInTime?: string;
  checkOutTime?: string;
  photos: IUnitPhoto[];
  pricing: {
    nightly: number;
    weekend?: number;
    cleaningFee?: number;
    currency: "SAR";
    minNights: number;
  };
  blockedDates: string[];
  tourismLicenseNumber?: string;
  status: UnitStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UnitDocument = HydratedDocument<IUnit>;

const UnitPhotoSchema = new Schema<IUnitPhoto>(
  {
    fileId: { type: Schema.Types.ObjectId, required: true },
    thumbId: { type: Schema.Types.ObjectId },
    order: { type: Number, default: 0 },
    isCover: { type: Boolean, default: false },
  },
  { _id: false }
);

const UnitSchema = new Schema<IUnit>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: {
      ar: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    description: {
      ar: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    type: { type: String, enum: UNIT_TYPES },
    city: { type: String },
    district: { type: String },
    address: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    guests: { type: Number, default: 1 },
    bedrooms: { type: Number, default: 1 },
    beds: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },
    areaM2: { type: Number },
    amenities: [{ type: String, enum: AMENITIES }],
    houseRules: { type: String },
    checkInTime: { type: String, default: "15:00" },
    checkOutTime: { type: String, default: "12:00" },
    photos: [UnitPhotoSchema],
    pricing: {
      nightly: { type: Number, default: 0 },
      weekend: { type: Number },
      cleaningFee: { type: Number, default: 0 },
      currency: { type: String, default: "SAR" },
      minNights: { type: Number, default: 1 },
    },
    blockedDates: [{ type: String }],
    tourismLicenseNumber: { type: String },
    status: {
      type: String,
      enum: ["draft", "pending_review", "published", "rejected", "unlisted"],
      default: "draft",
      index: true,
    },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const Unit: Model<IUnit> =
  (models.Unit as Model<IUnit>) || model<IUnit>("Unit", UnitSchema);
