"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

const variantMap: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  draft: "secondary",
  pending_review: "warning",
  published: "success",
  rejected: "destructive",
  unlisted: "outline",
};

export function UnitStatusBadge({ status }: { status: string }) {
  const t = useTranslations("units.statuses");
  return (
    <Badge variant={variantMap[status] || "secondary"}>
      {t(status as "draft")}
    </Badge>
  );
}
