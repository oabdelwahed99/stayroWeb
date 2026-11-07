import { getTranslations } from "next-intl/server";
import type { PublicUnit } from "@/lib/public-units";
import { PublicUnitCard } from "./public-unit-card";

export async function PublicUnitGrid({ units, locale }: { units: PublicUnit[]; locale: string }) {
  const t = await getTranslations("publicUnits");
  const tu = await getTranslations("units");

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {units.map((unit) => (
        <PublicUnitCard
          key={unit.id}
          unit={unit}
          locale={locale}
          labels={{
            type: unit.type ? tu(`types.${unit.type as "apartment"}`) : "",
            perNight: t("perNight"),
            guests: t("guestsCount", { count: unit.guests }),
            bedrooms: t("bedroomsCount", { count: unit.bedrooms }),
          }}
        />
      ))}
    </div>
  );
}
