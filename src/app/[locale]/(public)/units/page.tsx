import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublishedUnits } from "@/lib/public-units";
import { PublicUnitGrid } from "@/components/units/public-unit-grid";

export const revalidate = 60;

export default async function PublicUnitsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("publicUnits");
  const units = await getPublishedUnits();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("allTitle")}</h1>
      <p className="mb-8 mt-2 text-muted-foreground">{t("allSubtitle")}</p>
      {units.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <PublicUnitGrid units={units} locale={locale} />
      )}
    </div>
  );
}
