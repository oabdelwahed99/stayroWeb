import mongoose, { Schema, models, model } from "mongoose";

export type IdType = "national_id" | "iqama" | "passport";
export type VerificationStatus = "pending" | "verified" | "rejected";

export interface IOwnerProfile {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  idType?: IdType;
  idNumber?: string;
  avatarFileId?: mongoose.Types.ObjectId | null;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OwnerProfileSchema = new Schema<IOwnerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    idType: { type: String, enum: ["national_id", "iqama", "passport"] },
    idNumber: { type: String },
    avatarFileId: { type: Schema.Types.ObjectId, default: null },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const OwnerProfile =
  models.OwnerProfile || model<IOwnerProfile>("OwnerProfile", OwnerProfileSchema);
