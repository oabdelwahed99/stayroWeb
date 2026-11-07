"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { toggleBlockedDate } from "@/lib/actions/units";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CalendarEditor({
  unitId,
  initialBlocked,
}: {
  unitId: string;
  initialBlocked: string[];
}) {
  const t = useTranslations("units");
  const locale = useLocale();
  const [month, setMonth] = useState(new Date());
  const [blocked, setBlocked] = useState(initialBlocked);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  async function onToggle(date: Date) {
    const key = format(date, "yyyy-MM-dd");
    const result = await toggleBlockedDate(unitId, key);
    if (result.ok) {
      setBlocked(result.blockedDates || []);
    } else {
      toast.error("Error");
    }
  }

  const dfLocale = locale === "ar" ? arSA : enUS;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("calendar")}</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setMonth((m) => addMonths(m, -1))}>
            ‹
          </Button>
          <span className="min-w-32 text-center text-sm font-medium">
            {format(month, "MMMM yyyy", { locale: dfLocale })}
          </span>
          <Button variant="outline" size="sm" onClick={() => setMonth((m) => addMonths(m, 1))}>
            ›
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const isBlocked = blocked.includes(key);
            const inMonth = isSameMonth(day, month);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggle(day)}
                className={cn(
                  "aspect-square rounded-md text-sm transition-colors",
                  !inMonth && "opacity-30",
                  isBlocked
                    ? "bg-destructive text-destructive-foreground"
                    : "hover:bg-muted"
                )}
                title={isBlocked ? t("unblockDate") : t("blockDate")}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("blockedDates")}: {blocked.length}
        </p>
      </CardContent>
    </Card>
  );
}
