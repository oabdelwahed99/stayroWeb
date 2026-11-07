"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  approveUnit,
  rejectUnit,
  verifyOwner,
  rejectOwner,
  addEarning,
  updatePayoutStatus,
} from "@/lib/actions/admin";
import { formatSAR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Owner = { _id: string; name: string; email: string };

export function AdminPanel({
  units,
  profiles,
  payouts,
  owners,
}: {
  units: Array<{
    _id: string;
    title: { ar: string; en: string };
    city?: string;
    owner?: Owner;
  }>;
  profiles: Array<{
    _id: string;
    idType?: string;
    idNumber?: string;
    owner?: Owner;
  }>;
  payouts: Array<{
    _id: string;
    amount: number;
    status: string;
    owner?: Owner;
  }>;
  owners: Owner[];
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [reason, setReason] = useState("");
  const [earningOwner, setEarningOwner] = useState(owners[0]?._id || "");
  const [earningAmount, setEarningAmount] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      <Tabs defaultValue="units">
        <TabsList>
          <TabsTrigger value="units">{t("unitsQueue")}</TabsTrigger>
          <TabsTrigger value="owners">{t("ownersQueue")}</TabsTrigger>
          <TabsTrigger value="payouts">{t("payoutsQueue")}</TabsTrigger>
          <TabsTrigger value="earnings">{t("addEarning")}</TabsTrigger>
        </TabsList>

        <TabsContent value="units" className="space-y-3">
          {units.length === 0 && <p className="text-muted-foreground">{t("noItems")}</p>}
          {units.map((u) => (
            <Card key={u._id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {locale === "ar" ? u.title.ar || u.title.en : u.title.en || u.title.ar}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t("owner")}: {u.owner?.name} ({u.owner?.email}) · {u.city}
                </p>
                <Textarea
                  placeholder={t("reason")}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      await approveUnit(u._id);
                      toast.success(tc("success"));
                      window.location.reload();
                    }}
                  >
                    {t("approve")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      await rejectUnit(u._id, reason);
                      toast.success(tc("success"));
                      window.location.reload();
                    }}
                  >
                    {t("reject")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="owners" className="space-y-3">
          {profiles.length === 0 && <p className="text-muted-foreground">{t("noItems")}</p>}
          {profiles.map((p) => (
            <Card key={p._id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{p.owner?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.idType}: {p.idNumber}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      await verifyOwner(p._id);
                      toast.success(tc("success"));
                      window.location.reload();
                    }}
                  >
                    {t("approve")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      await rejectOwner(p._id, reason || "Rejected");
                      toast.success(tc("success"));
                      window.location.reload();
                    }}
                  >
                    {t("reject")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payouts" className="space-y-3">
          {payouts.length === 0 && <p className="text-muted-foreground">{t("noItems")}</p>}
          {payouts.map((p) => (
            <Card key={p._id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{p.owner?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatSAR(p.amount, locale)} · {p.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await updatePayoutStatus(p._id, "processing");
                      window.location.reload();
                    }}
                  >
                    {t("markProcessing")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      await updatePayoutStatus(p._id, "paid");
                      window.location.reload();
                    }}
                  >
                    {t("markPaid")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      await updatePayoutStatus(p._id, "failed", "Marked failed by admin");
                      window.location.reload();
                    }}
                  >
                    {t("markFailed")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>{t("addEarning")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={earningOwner}
                onChange={(e) => setEarningOwner(e.target.value)}
              >
                {owners.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name} ({o.email})
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={1}
                placeholder="Amount SAR"
                value={earningAmount}
                onChange={(e) => setEarningAmount(e.target.value)}
              />
              <Button
                onClick={async () => {
                  const result = await addEarning({
                    ownerId: earningOwner,
                    amount: Number(earningAmount),
                  });
                  if (!result.ok) {
                    toast.error(tc("error"));
                    return;
                  }
                  toast.success(tc("success"));
                  setEarningAmount("");
                }}
              >
                {t("addEarning")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
