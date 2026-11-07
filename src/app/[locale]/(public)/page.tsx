import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2, Wallet, BadgeCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/layout/brand-logo";
import { PublicUnitGrid } from "@/components/units/public-unit-grid";
import { getPublishedUnits } from "@/lib/public-units";

export const revalidate = 60;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const nav = await getTranslations("nav");
  const featured = await getPublishedUnits(6);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/brand/hero.webp"
            alt=""
            fill
            priority
            className="object-cover opacity-30"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-24 md:py-32">
          <BrandLogo size={48} />
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">{t("heroSubtitle")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">{t("cta")}</Link>
            </Button>
            {featured.length > 0 && (
              <Button asChild variant="outline" size="lg">
                <a href="#featured">{t("exploreUnits")}</a>
              </Button>
            )}
            <Button asChild variant="ghost" size="lg">
              <Link href="/login">{t("ctaLogin")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section id="featured" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">{t("featuredTitle")}</h2>
              <p className="mt-2 text-muted-foreground">{t("featuredSubtitle")}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/units">{t("viewAllUnits")}</Link>
            </Button>
          </div>
          <PublicUnitGrid units={featured} locale={locale} />
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">{t("featuresTitle")}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Building2, title: t("feature1Title"), desc: t("feature1Desc") },
            { icon: Wallet, title: t("feature2Title"), desc: t("feature2Desc") },
            { icon: BadgeCheck, title: t("feature3Title"), desc: t("feature3Desc") },
          ].map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <f.icon className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-xl">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{f.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-3xl font-bold">{t("howTitle")}</h2>
          <ol className="grid gap-4 md:grid-cols-4">
            {[t("step1"), t("step2"), t("step3"), t("step4")].map((step, i) => (
              <li key={step} className="rounded-xl border bg-card p-5 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <p className="font-medium">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link href="/register">{nav("listUnit")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
