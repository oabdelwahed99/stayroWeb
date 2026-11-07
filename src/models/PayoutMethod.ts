import mongoose, { Schema, models, model } from "mongoose";

export interface IPayoutMethod {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  bankName: string;
  accountHolder: string;
  iban: string;
  ibanMasked: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutMethodSchema = new Schema<IPayoutMethod>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bankName: { type: String, required: true },
    accountHolder: { type: String, required: true },
    iban: { type: String, required: true },
    ibanMasked: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PayoutMethod =
  models.PayoutMethod || model<IPayoutMethod>("PayoutMethod", PayoutMethodSchema);
