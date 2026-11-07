import { redirect } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import { createDraftUnit } from "@/lib/actions/units";

export const dynamic = "force-dynamic";

export default async function NewUnitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const result = await createDraftUnit();
  redirect({ href: `/dashboard/units/${result.id}/edit`, locale });
}
