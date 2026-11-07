import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Unit } from "@/models/Unit";
import { Transaction } from "@/models/Transaction";
import { getOwnerBalance } from "@/lib/balance";
import { formatSAR } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const t = await getTranslations("dashboard");
  const tu = await getTranslations("units");
  const tp = await getTranslations("payouts");

  await connectDB();
  const ownerId = session!.user.id;
  const units = await Unit.find({ ownerId }).lean();
  const balance = await getOwnerBalance(ownerId);
  const transactions = await Transaction.find({ ownerId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const counts = {
    total: units.length,
    published: units.filter((u) => u.status === "published").length,
    pending: units.filter((u) => u.status === "pending_review").length,
    drafts: units.filter((u) => u.status === "draft").length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("welcome", { name: session!.user.name || "" })}</h1>
          <p className="text-muted-foreground">{t("overview")}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/units/new">{t("quickAdd")}</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: t("totalUnits"), value: counts.total },
          { label: t("published"), value: counts.published },
          { label: t("pending"), value: counts.pending },
          { label: t("drafts"), value: counts.drafts },
          { label: t("balance"), value: formatSAR(balance, locale) },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{stat.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentTransactions")}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground">{t("noTransactions")}</p>
          ) : (
            <ul className="divide-y">
              {transactions.map((tx) => (
                <li key={String(tx._id)} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{tp(`types.${tx.type}`)}</p>
                    <p className="text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-SA")}
                    </p>
                  </div>
                  <span className={tx.amount >= 0 ? "text-emerald-600" : "text-destructive"}>
                    {formatSAR(tx.amount, locale)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {units.slice(0, 3).length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{tu("title")}</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/units">{tu("title")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {units.slice(0, 3).map((u) => (
              <Link
                key={String(u._id)}
                href={`/dashboard/units/${u._id}/edit`}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
              >
                <span className="font-medium">
                  {locale === "ar" ? u.title.ar || u.title.en : u.title.en || u.title.ar || "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tu(`statuses.${u.status}`)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
