import mongoose, { Schema, models, model } from "mongoose";

export type UserRole = "owner" | "admin";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  emailVerified: Date | null;
  locale: "ar" | "en";
  emailVerifyToken?: string | null;
  emailVerifyExpires?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ["owner", "admin"], default: "owner" },
    emailVerified: { type: Date, default: null },
    locale: { type: String, enum: ["ar", "en"], default: "ar" },
    emailVerifyToken: { type: String, default: null },
    emailVerifyExpires: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
