export interface BankAccountInput {
  iban: string;
  accountHolder: string;
  bankName: string;
}

export interface CreatePayoutInput {
  amount: number;
  currency: "SAR";
  iban: string;
  accountHolder: string;
  reference: string;
}

export interface PayoutResult {
  providerRef: string;
  status: "processing" | "paid" | "failed";
  message?: string;
}

export interface PayoutProvider {
  name: string;
  validateBankAccount(input: BankAccountInput): Promise<{ valid: boolean; message?: string }>;
  createPayout(input: CreatePayoutInput): Promise<PayoutResult>;
  getPayoutStatus(providerRef: string): Promise<PayoutResult>;
}
