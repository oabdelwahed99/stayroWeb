import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getUnitForOwner } from "@/lib/actions/units";
import { UnitWizard } from "@/components/units/wizard/unit-wizard";

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const unit = await getUnitForOwner(id);
  if (!unit) notFound();

  return <UnitWizard initial={unit} />;
}
