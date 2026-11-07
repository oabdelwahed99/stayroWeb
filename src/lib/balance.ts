import { connectDB } from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import mongoose from "mongoose";

/** Completed credits minus completed debits (payouts/fees stored as negative amounts). */
export async function getOwnerBalance(ownerId: string | mongoose.Types.ObjectId) {
  await connectDB();
  const result = await Transaction.aggregate([
    {
      $match: {
        ownerId: new mongoose.Types.ObjectId(ownerId.toString()),
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        balance: { $sum: "$amount" },
      },
    },
  ]);

  return result[0]?.balance ?? 0;
}
