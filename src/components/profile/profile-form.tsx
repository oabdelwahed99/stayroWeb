"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  updateProfile,
  submitVerification,
  changePassword,
} from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProfileForm({
  user,
  profile,
}: {
  user: {
    name: string;
    email: string;
    phone?: string;
    locale: "ar" | "en";
  };
  profile: {
    idType?: string;
    idNumber?: string;
    verificationStatus: string;
    rejectionReason?: string;
  } | null;
}) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const [idType, setIdType] = useState(profile?.idType || "national_id");
  const [locale, setLocale] = useState(user.locale);

  async function onSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await updateProfile({
      name: form.get("name"),
      phone: form.get("phone"),
      locale,
    });
    toast[result.ok ? "success" : "error"](result.ok ? t("updated") : tc("error"));
  }

  async function onVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await submitVerification({
      idType,
      idNumber: form.get("idNumber"),
    });
    toast[result.ok ? "success" : "error"](result.ok ? t("updated") : tc("error"));
  }

  async function onPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = await changePassword({
      currentPassword: form.get("currentPassword"),
      newPassword: form.get("newPassword"),
      confirmPassword: form.get("confirmPassword"),
    });
    if (!result.ok) {
      toast.error(tc("error"));
      return;
    }
    toast.success(t("updated"));
    e.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("personalInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t("personalInfo")}</Label>
              <Input name="name" defaultValue={user.name} required />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input name="phone" defaultValue={user.phone || ""} />
            </div>
            <div className="space-y-2">
              <Label>{tc("language")}</Label>
              <Select value={locale} onValueChange={(v) => setLocale(v as "ar" | "en")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">{tc("save")}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("verification")}</CardTitle>
          <Badge
            variant={
              profile?.verificationStatus === "verified"
                ? "success"
                : profile?.verificationStatus === "rejected"
                  ? "destructive"
                  : "warning"
            }
          >
            {t(`verificationStatuses.${(profile?.verificationStatus || "pending") as "pending"}`)}
          </Badge>
        </CardHeader>
        <CardContent>
          <form onSubmit={onVerify} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("idType")}</Label>
              <Select value={idType} onValueChange={setIdType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national_id">{t("idTypes.national_id")}</SelectItem>
                  <SelectItem value="iqama">{t("idTypes.iqama")}</SelectItem>
                  <SelectItem value="passport">{t("idTypes.passport")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("idNumber")}</Label>
              <Input name="idNumber" defaultValue={profile?.idNumber || ""} required />
            </div>
            {profile?.rejectionReason && (
              <p className="text-sm text-destructive">{profile.rejectionReason}</p>
            )}
            <Button type="submit">{t("submitVerification")}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("changePassword")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onPassword} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("currentPassword")}</Label>
              <Input name="currentPassword" type="password" required />
            </div>
            <div className="space-y-2">
              <Label>{t("newPassword")}</Label>
              <Input name="newPassword" type="password" required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label>Confirm</Label>
              <Input name="confirmPassword" type="password" required minLength={8} />
            </div>
            <Button type="submit">{tc("save")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
