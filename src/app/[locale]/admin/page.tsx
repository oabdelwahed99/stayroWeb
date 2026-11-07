import { setRequestLocale } from "next-intl/server";
import { getAdminData } from "@/lib/actions/admin";
import { AdminPanel } from "@/components/admin/admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await getAdminData();
  return (
    <AdminPanel
      units={data.units}
      profiles={data.profiles}
      payouts={data.payouts}
      owners={data.owners}
    />
  );
}
