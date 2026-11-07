import mongoose, { Schema, models, model } from "mongoose";

export type PayoutRequestStatus = "requested" | "processing" | "paid" | "failed";

export interface IPayoutRequest {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  amount: number;
  payoutMethodId: mongoose.Types.ObjectId;
  status: PayoutRequestStatus;
  providerRef?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutRequestSchema = new Schema<IPayoutRequest>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    payoutMethodId: { type: Schema.Types.ObjectId, ref: "PayoutMethod", required: true },
    status: {
      type: String,
      enum: ["requested", "processing", "paid", "failed"],
      default: "requested",
      index: true,
    },
    providerRef: { type: String },
    failureReason: { type: String },
  },
  { timestamps: true }
);

export const PayoutRequest =
  models.PayoutRequest || model<IPayoutRequest>("PayoutRequest", PayoutRequestSchema);
