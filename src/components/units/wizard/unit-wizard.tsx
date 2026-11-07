"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  Home,
  MapPin,
  ListChecks,
  Sparkles,
  Images,
  Banknote,
  ScrollText,
  CheckCircle2,
  Upload,
  Star,
  Trash2,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { AMENITIES, UNIT_TYPES } from "@/lib/constants/unit";
import {
  updateUnitDraft,
  submitUnitForReview,
  deleteUnitPhoto,
  setCoverPhoto,
  unlistUnit,
} from "@/lib/actions/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const LocationMap = dynamic(
  () => import("@/components/units/location-map").then((m) => m.LocationMap),
  { ssr: false }
);

type Photo = {
  fileId: string;
  thumbId?: string;
  order: number;
  isCover: boolean;
};

type UnitData = {
  _id: string;
  type?: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  city?: string;
  district?: string;
  address?: string;
  location?: { lat: number; lng: number };
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  areaM2?: number;
  amenities: string[];
  houseRules?: string;
  checkInTime?: string;
  checkOutTime?: string;
  photos: Photo[];
  pricing: {
    nightly: number;
    weekend?: number;
    cleaningFee?: number;
    currency: "SAR";
    minNights: number;
  };
  tourismLicenseNumber?: string;
  status: string;
  rejectionReason?: string;
};

const STEPS = [
  { key: "type", icon: Home },
  { key: "location", icon: MapPin },
  { key: "details", icon: ListChecks },
  { key: "amenities", icon: Sparkles },
  { key: "photos", icon: Images },
  { key: "pricing", icon: Banknote },
  { key: "rules", icon: ScrollText },
  { key: "review", icon: CheckCircle2 },
] as const;

export function UnitWizard({ initial }: { initial: UnitData }) {
  const t = useTranslations("units");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [unit, setUnit] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const progress = ((step + 1) / STEPS.length) * 100;

  function patch(partial: Partial<UnitData>) {
    setUnit((prev) => ({ ...prev, ...partial }));
  }

  async function saveDraft(partial?: Partial<UnitData>) {
    setSaving(true);
    const data = { ...unit, ...partial };
    const result = await updateUnitDraft(unit._id, {
      type: data.type,
      title: data.title,
      description: data.description,
      city: data.city,
      district: data.district,
      address: data.address,
      location: data.location,
      guests: data.guests,
      bedrooms: data.bedrooms,
      beds: data.beds,
      bathrooms: data.bathrooms,
      areaM2: data.areaM2,
      amenities: data.amenities,
      houseRules: data.houseRules,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      pricing: data.pricing,
      tourismLicenseNumber: data.tourismLicenseNumber,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(tc("error"));
      return false;
    }
    return true;
  }

  async function goNext() {
    const ok = await saveDraft();
    if (ok) {
      toast.success(t("draftSaved"));
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  }

  async function handleSubmit() {
    const ok = await saveDraft();
    if (!ok) return;
    const result = await submitUnitForReview(unit._id);
    if (!result.ok) {
      toast.error(t("missingRequired"));
      return;
    }
    toast.success(t("submitted"));
    router.push("/dashboard/units");
    router.refresh();
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/units/${unit._id}/photos`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (res.ok && json.photo) {
        setUnit((prev) => ({
          ...prev,
          photos: [...prev.photos, json.photo],
        }));
      } else {
        toast.error(json.error || tc("error"));
      }
    }
    setUploading(false);
  }

  async function removePhoto(fileId: string) {
    const result = await deleteUnitPhoto(unit._id, fileId);
    if (result.ok) {
      setUnit((prev) => ({
        ...prev,
        photos: prev.photos.filter((p) => p.fileId !== fileId),
      }));
    }
  }

  async function makeCover(fileId: string) {
    const result = await setCoverPhoto(unit._id, fileId);
    if (result.ok) {
      setUnit((prev) => ({
        ...prev,
        photos: prev.photos.map((p) => ({ ...p, isCover: p.fileId === fileId })),
      }));
    }
  }

  const stepTitle = useMemo(() => {
    const key = STEPS[step].key;
    return t(key);
  }, [step, t]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {t("wizardProgress", { current: step + 1, total: STEPS.length })}
        </p>
        <h1 className="text-2xl font-bold">{stepTitle}</h1>
        <Progress value={progress} className="mt-3" />
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-3 py-1 text-xs",
                i === step ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="h-3 w-3" />
              {t(s.key)}
            </button>
          );
        })}
      </div>

      {unit.status === "rejected" && unit.rejectionReason && (
        <Alert variant="destructive">
          <AlertDescription>
            {t("rejectionReason")}: {unit.rejectionReason}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="space-y-4 p-6">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {UNIT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => patch({ type })}
                  className={cn(
                    "rounded-xl border p-4 text-start font-medium transition-colors hover:border-primary",
                    unit.type === type && "border-primary bg-primary/5"
                  )}
                >
                  {t(`types.${type}`)}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("city")}</Label>
                  <Input
                    value={unit.city || ""}
                    onChange={(e) => patch({ city: e.target.value })}
                    placeholder="Riyadh"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("district")}</Label>
                  <Input
                    value={unit.district || ""}
                    onChange={(e) => patch({ district: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("address")}</Label>
                <Input
                  value={unit.address || ""}
                  onChange={(e) => patch({ address: e.target.value })}
                />
              </div>
              <p className="text-sm text-muted-foreground">{t("mapHint")}</p>
              <LocationMap
                value={unit.location}
                onChange={(location) => patch({ location })}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("titleAr")}</Label>
                  <Input
                    value={unit.title.ar}
                    onChange={(e) =>
                      patch({ title: { ...unit.title, ar: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("titleEn")}</Label>
                  <Input
                    value={unit.title.en}
                    onChange={(e) =>
                      patch({ title: { ...unit.title, en: e.target.value } })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("descAr")}</Label>
                <Textarea
                  rows={4}
                  value={unit.description.ar}
                  onChange={(e) =>
                    patch({ description: { ...unit.description, ar: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("descEn")}</Label>
                <Textarea
                  rows={4}
                  value={unit.description.en}
                  onChange={(e) =>
                    patch({ description: { ...unit.description, en: e.target.value } })
                  }
                />
              </div>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
                {(
                  [
                    ["guests", unit.guests],
                    ["bedrooms", unit.bedrooms],
                    ["beds", unit.beds],
                    ["bathrooms", unit.bathrooms],
                    ["area", unit.areaM2 || 0],
                  ] as const
                ).map(([key, val]) => (
                  <div key={key} className="space-y-2">
                    <Label>{t(key === "area" ? "area" : key)}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={val}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (key === "area") patch({ areaM2: n });
                        else patch({ [key]: n } as Partial<UnitData>);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {AMENITIES.map((a) => {
                const checked = unit.amenities.includes(a);
                return (
                  <label
                    key={a}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        patch({
                          amenities: v
                            ? [...unit.amenities, a]
                            : unit.amenities.filter((x) => x !== a),
                        });
                      }}
                    />
                    <span>{t(`amenityLabels.${a}`)}</span>
                  </label>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-center hover:bg-muted/40">
                <Upload className="h-8 w-8 text-primary" />
                <span className="font-medium">{t("dropPhotos")}</span>
                <span className="text-xs text-muted-foreground">{t("photoHint")}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => onUpload(e.target.files)}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {unit.photos
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((photo) => (
                    <div key={photo.fileId} className="relative overflow-hidden rounded-lg border">
                      <div className="relative aspect-square">
                        <Image
                          src={`/api/photos/${photo.fileId}?size=thumb`}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      {photo.isCover && (
                        <span className="absolute start-2 top-2 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {t("cover")}
                        </span>
                      )}
                      <div className="flex gap-1 p-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => makeCover(photo.fileId)}
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removePhoto(photo.fileId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["nightly", unit.pricing.nightly],
                  ["weekend", unit.pricing.weekend || 0],
                  ["cleaningFee", unit.pricing.cleaningFee || 0],
                  ["minNights", unit.pricing.minNights],
                ] as const
              ).map(([key, val]) => (
                <div key={key} className="space-y-2">
                  <Label>{t(key)}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={val}
                    onChange={(e) =>
                      patch({
                        pricing: {
                          ...unit.pricing,
                          [key]: Number(e.target.value),
                          currency: "SAR",
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("checkIn")}</Label>
                  <Input
                    type="time"
                    value={unit.checkInTime || "15:00"}
                    onChange={(e) => patch({ checkInTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("checkOut")}</Label>
                  <Input
                    type="time"
                    value={unit.checkOutTime || "12:00"}
                    onChange={(e) => patch({ checkOutTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("houseRules")}</Label>
                <Textarea
                  rows={4}
                  value={unit.houseRules || ""}
                  onChange={(e) => patch({ houseRules: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("tourismLicense")}</Label>
                <Input
                  value={unit.tourismLicenseNumber || ""}
                  onChange={(e) => patch({ tourismLicenseNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3 text-sm">
              <p>
                <strong>{t("type")}:</strong>{" "}
                {unit.type ? t(`types.${unit.type as "apartment"}`) : "—"}
              </p>
              <p>
                <strong>{t("location")}:</strong> {unit.city}, {unit.district}
              </p>
              <p>
                <strong>{locale === "ar" ? t("titleAr") : t("titleEn")}:</strong>{" "}
                {locale === "ar" ? unit.title.ar : unit.title.en}
              </p>
              <p>
                <strong>{t("photos")}:</strong> {unit.photos.length}
              </p>
              <p>
                <strong>{t("nightly")}:</strong> {unit.pricing.nightly} {tc("sar")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || saving}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          {tc("previous")}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={() => saveDraft()}>
            {t("saveDraft")}
          </Button>
          {unit.status === "published" && (
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await unlistUnit(unit._id);
                toast.success(t("unlist"));
                router.refresh();
              }}
            >
              {t("unlist")}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" disabled={saving} onClick={goNext}>
              {tc("next")}
            </Button>
          ) : (
            <Button type="button" disabled={saving} onClick={handleSubmit}>
              {t("submitReview")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
