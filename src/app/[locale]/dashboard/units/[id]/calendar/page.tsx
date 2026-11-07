import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getUnitForOwner } from "@/lib/actions/units";
import { CalendarEditor } from "@/components/units/calendar-editor";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function UnitCalendarPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const unit = await getUnitForOwner(id);
  if (!unit) notFound();
  const t = await getTranslations("units");
  const title =
    locale === "ar" ? unit.title.ar || unit.title.en : unit.title.en || unit.title.ar;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("calendar")}</h1>
          <p className="text-muted-foreground">{title}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/units/${id}/edit`}>{t("details")}</Link>
        </Button>
      </div>
      <CalendarEditor unitId={id} initialBlocked={unit.blockedDates || []} />
    </div>
  );
}
