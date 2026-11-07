import type { PayoutProvider } from "./provider";
import { mockPayoutProvider } from "./mock-provider";

export function getPayoutProvider(): PayoutProvider {
  const name = process.env.PAYOUT_PROVIDER || "mock";
  switch (name) {
    case "mock":
    default:
      return mockPayoutProvider;
  }
}

export type { PayoutProvider } from "./provider";
