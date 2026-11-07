import mongoose, { Schema, models, model } from "mongoose";

export type TransactionType = "booking_earning" | "fee" | "payout" | "adjustment";
export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";

export interface ITransaction {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  unitId?: mongoose.Types.ObjectId | null;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference?: string;
  description?: string;
  payoutRequestId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit", default: null },
    type: {
      type: String,
      enum: ["booking_earning", "fee", "payout", "adjustment"],
      required: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "completed",
    },
    reference: { type: String },
    description: { type: String },
    payoutRequestId: { type: Schema.Types.ObjectId, ref: "PayoutRequest", default: null },
  },
  { timestamps: true }
);

export const Transaction =
  models.Transaction || model<ITransaction>("Transaction", TransactionSchema);
