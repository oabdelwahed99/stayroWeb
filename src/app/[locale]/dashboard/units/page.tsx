import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Unit } from "@/models/Unit";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UnitStatusBadge } from "@/components/units/status-badge";
import { formatSAR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UnitsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const t = await getTranslations("units");
  await connectDB();
  const units = await Unit.find({ ownerId: session!.user.id }).sort({ updatedAt: -1 }).lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button asChild>
          <Link href="/dashboard/units/new">{t("addNew")}</Link>
        </Button>
      </div>

      {units.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-muted-foreground">{t("empty")}</p>
            <Button asChild>
              <Link href="/dashboard/units/new">{t("emptyCta")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => {
            const cover =
              unit.photos.find((p: { isCover: boolean; fileId: unknown }) => p.isCover) ||
              unit.photos[0];
            const title =
              locale === "ar"
                ? unit.title.ar || unit.title.en || "—"
                : unit.title.en || unit.title.ar || "—";
            return (
              <Card key={String(unit._id)} className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted">
                  {cover ? (
                    <Image
                      src={`/api/photos/${cover.fileId}?size=thumb`}
                      alt={title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold leading-tight">{title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {unit.city || "—"} · {formatSAR(unit.pricing?.nightly || 0, locale)}
                      </p>
                    </div>
                    <UnitStatusBadge status={unit.status} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/units/${unit._id}/edit`}>{t("details")}</Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/dashboard/units/${unit._id}/calendar`}>{t("calendar")}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
