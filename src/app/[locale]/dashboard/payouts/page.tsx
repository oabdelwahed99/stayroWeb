import { setRequestLocale } from "next-intl/server";
import { getPayoutData } from "@/lib/actions/payouts";
import { PayoutsClient } from "@/components/payouts/payouts-client";

export const dynamic = "force-dynamic";

export default async function PayoutsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await getPayoutData();
  return (
    <PayoutsClient
      balance={data.balance}
      methods={data.methods}
      transactions={data.transactions}
      requests={data.requests}
    />
  );
}
