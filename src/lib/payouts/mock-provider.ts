import type {
  BankAccountInput,
  CreatePayoutInput,
  PayoutProvider,
  PayoutResult,
} from "./provider";

const store = new Map<string, PayoutResult>();

export const mockPayoutProvider: PayoutProvider = {
  name: "mock",

  async validateBankAccount(input: BankAccountInput) {
    const iban = input.iban.replace(/\s/g, "").toUpperCase();
    if (!/^SA\d{22}$/.test(iban)) {
      return { valid: false, message: "IBAN must be a valid Saudi IBAN (SA + 22 digits)" };
    }
    return { valid: true };
  },

  async createPayout(input: CreatePayoutInput): Promise<PayoutResult> {
    const providerRef = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const result: PayoutResult = {
      providerRef,
      status: "processing",
      message: `Mock payout of ${input.amount} SAR queued`,
    };
    store.set(providerRef, result);

    // Simulate async settlement after a short delay (in-memory only)
    setTimeout(() => {
      store.set(providerRef, {
        providerRef,
        status: "paid",
        message: "Mock payout settled",
      });
    }, 5000);

    return result;
  },

  async getPayoutStatus(providerRef: string): Promise<PayoutResult> {
    return (
      store.get(providerRef) || {
        providerRef,
        status: "failed",
        message: "Unknown reference",
      }
    );
  },
};
