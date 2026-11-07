"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import {
  addPayoutMethod,
  requestPayout,
  setDefaultPayoutMethod,
  deletePayoutMethod,
} from "@/lib/actions/payouts";
import { formatSAR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Method = {
  _id: string;
  bankName: string;
  accountHolder: string;
  ibanMasked: string;
  isDefault: boolean;
};

type Tx = {
  _id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  createdAt: string;
};

type Req = {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
};

export function PayoutsClient({
  balance,
  methods: initialMethods,
  transactions,
  requests,
}: {
  balance: number;
  methods: Method[];
  transactions: Tx[];
  requests: Req[];
}) {
  const t = useTranslations("payouts");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [methods, setMethods] = useState(initialMethods);
  const [amount, setAmount] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  async function onAddMethod(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await addPayoutMethod({
      bankName: form.get("bankName"),
      accountHolder: form.get("accountHolder"),
      iban: form.get("iban"),
      isDefault: methods.length === 0,
    });
    if (!result.ok) {
      toast.error(result.error === "invalidIban" ? t("ibanHint") : tc("error"));
      return;
    }
    toast.success(tc("success"));
    setShowAdd(false);
    window.location.reload();
  }

  async function onRequest() {
    const value = Number(amount);
    const method = methods.find((m) => m.isDefault) || methods[0];
    if (!method) {
      toast.error(t("noMethods"));
      return;
    }
    const result = await requestPayout({
      amount: value,
      payoutMethodId: method._id,
    });
    if (!result.ok) {
      toast.error(
        result.error === "insufficient"
          ? t("insufficient")
          : result.error === "validation"
            ? t("minAmount")
            : tc("error")
      );
      return;
    }
    toast.success(t("requestSuccess"));
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/payouts/methods">{t("methods")}</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("balance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{formatSAR(balance, locale)}</p>
            <div className="mt-4 flex gap-2">
              <Input
                type="number"
                min={50}
                placeholder={t("amount")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button onClick={onRequest}>{t("requestPayout")}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("methods")}</CardTitle>
            <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
              {t("addMethod")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAdd && (
              <form onSubmit={onAddMethod} className="space-y-3 rounded-lg border p-3">
                <div className="space-y-1">
                  <Label>{t("bankName")}</Label>
                  <Input name="bankName" required />
                </div>
                <div className="space-y-1">
                  <Label>{t("accountHolder")}</Label>
                  <Input name="accountHolder" required />
                </div>
                <div className="space-y-1">
                  <Label>{t("iban")}</Label>
                  <Input name="iban" placeholder="SAxxxxxxxxxxxxxxxxxxxxxx" required />
                  <p className="text-xs text-muted-foreground">{t("ibanHint")}</p>
                </div>
                <Button type="submit" size="sm">
                  {tc("save")}
                </Button>
              </form>
            )}
            {methods.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noMethods")}</p>
            ) : (
              methods.map((m) => (
                <div key={m._id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">
                      {m.bankName}{" "}
                      {m.isDefault && <Badge variant="secondary">{t("default")}</Badge>}
                    </p>
                    <p className="text-sm text-muted-foreground">{m.ibanMasked}</p>
                  </div>
                  <div className="flex gap-1">
                    {!m.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await setDefaultPayoutMethod(m._id);
                          setMethods((prev) =>
                            prev.map((x) => ({ ...x, isDefault: x._id === m._id }))
                          );
                        }}
                      >
                        {t("setDefault")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await deletePayoutMethod(m._id);
                        setMethods((prev) => prev.filter((x) => x._id !== m._id));
                      }}
                    >
                      {tc("delete")}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("ledger")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {transactions.map((tx) => (
              <li key={tx._id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{t(`types.${tx.type as "payout"}`)}</p>
                  <p className="text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleString(locale === "ar" ? "ar-SA" : "en-SA")}
                    {" · "}
                    {t(`statuses.${tx.status as "completed"}`)}
                  </p>
                </div>
                <span className={tx.amount >= 0 ? "text-emerald-600" : "text-destructive"}>
                  {formatSAR(tx.amount, locale)}
                </span>
              </li>
            ))}
            {requests.map((r) => (
              <li key={r._id} className="flex items-center justify-between py-3 text-sm opacity-80">
                <div>
                  <p className="font-medium">{t("requestPayout")}</p>
                  <p className="text-muted-foreground">
                    {t(`statuses.${r.status as "requested"}`)}
                  </p>
                </div>
                <span>{formatSAR(r.amount, locale)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
