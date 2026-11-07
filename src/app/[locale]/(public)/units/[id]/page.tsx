import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight, Bath, BedDouble, Check, MapPin, Ruler, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getPublishedUnit, localized } from "@/lib/public-units";
import { formatSAR } from "@/lib/utils";
import { UnitGallery } from "@/components/units/unit-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const unit = await getPublishedUnit(id);
  return unit ? { title: localized(unit.title, locale) } : {};
}

export default async function PublicUnitPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const unit = await getPublishedUnit(id);
  if (!unit) notFound();

  const t = await getTranslations("publicUnits");
  const tu = await getTranslations("units");
  const nav = await getTranslations("nav");
  const title = localized(unit.title, locale);
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  const stats = [
    { icon: Users, label: t("guestsCount", { count: unit.guests }) },
    { icon: BedDouble, label: t("bedroomsCount", { count: unit.bedrooms }) },
    { icon: BedDouble, label: t("bedsCount", { count: unit.beds }) },
    { icon: Bath, label: t("bathroomsCount", { count: unit.bathrooms }) },
    ...(unit.areaM2 ? [{ icon: Ruler, label: t("area", { area: unit.areaM2 }) }] : []),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/units"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <BackIcon className="h-4 w-4" />
        {t("back")}
      </Link>

      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 flex items-center gap-1 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        {[unit.district, unit.city].filter(Boolean).join("، ")}
        {unit.type && <span>· {tu(`types.${unit.type as "apartment"}`)}</span>}
      </p>

      <UnitGallery
        photoIds={unit.photoIds}
        title={title}
        rtl={locale === "ar"}
        labels={{
          showAll: t("showAllPhotos", { count: unit.photoIds.length }),
          close: t("closeGallery"),
          prev: t("prevPhoto"),
          next: t("nextPhoto"),
        }}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {stats.map((s) => (
              <span key={s.label} className="flex items-center gap-2 text-sm">
                <s.icon className="h-5 w-5 text-primary" />
                {s.label}
              </span>
            ))}
          </div>

          <Separator />

          <section>
            <h2 className="mb-3 text-xl font-semibold">{t("about")}</h2>
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {localized(unit.description, locale)}
            </p>
          </section>

          {unit.amenities.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-semibold">{t("amenities")}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {unit.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {tu(`amenityLabels.${a as "wifi"}`)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-xl font-semibold">{t("houseRules")}</h2>
            <div className="mb-3 flex gap-6 text-sm">
              <span>
                {t("checkIn")}: <strong>{unit.checkInTime}</strong>
              </span>
              <span>
                {t("checkOut")}: <strong>{unit.checkOutTime}</strong>
              </span>
            </div>
            {unit.houseRules && (
              <p className="whitespace-pre-line text-sm text-muted-foreground">{unit.houseRules}</p>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="space-y-4 p-6">
              <p>
                <span className="text-2xl font-bold text-primary">
                  {formatSAR(unit.pricing.nightly, locale)}
                </span>{" "}
                <span className="text-muted-foreground">{t("perNight")}</span>
              </p>
              <dl className="space-y-2 text-sm">
                {unit.pricing.weekend ? (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("weekendPrice")}</dt>
                    <dd>{formatSAR(unit.pricing.weekend, locale)}</dd>
                  </div>
                ) : null}
                {unit.pricing.cleaningFee ? (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("cleaningFee")}</dt>
                    <dd>{formatSAR(unit.pricing.cleaningFee, locale)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("minNights")}</dt>
                  <dd>{t("minNightsValue", { count: unit.pricing.minNights })}</dd>
                </div>
              </dl>
              <Button className="w-full" size="lg" disabled>
                {t("bookingSoon")}
              </Button>
              <p className="text-center text-xs text-muted-foreground">{t("bookingSoonHint")}</p>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="space-y-3 p-6">
              <p className="font-semibold">{t("ownerCtaTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("ownerCtaDesc")}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/register">{nav("listUnit")}</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
