import { getTranslations, setRequestLocale } from "next-intl/server";
import { verifyEmailToken } from "@/lib/actions/auth";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("auth");

  let message = t("verifyEmailDesc");
  let ok = false;

  if (sp.token) {
    const result = await verifyEmailToken(sp.token);
    ok = result.ok;
    message = result.ok ? t("verifySuccess") : t("verifyFailed");
  }

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>{t("verifyEmailTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {ok && (
            <Button asChild>
              <Link href="/login">{t("loginButton")}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
