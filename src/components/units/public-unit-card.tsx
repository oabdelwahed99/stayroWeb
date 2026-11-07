import Image from "next/image";
import { BedDouble, MapPin, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatSAR } from "@/lib/utils";
import { localized, type PublicUnit } from "@/lib/public-units";

export function PublicUnitCard({
  unit,
  locale,
  labels,
}: {
  unit: PublicUnit;
  locale: string;
  labels: { type: string; perNight: string; guests: string; bedrooms: string };
}) {
  const title = localized(unit.title, locale);
  const cover = unit.photoIds[0];

  return (
    <Link
      href={`/units/${unit.id}`}
      className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {cover && (
          <Image
            src={`/api/photos/${cover}`}
            alt={title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <span className="absolute start-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold shadow-sm">
          {labels.type}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 font-semibold">{title}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">
            {[unit.district, unit.city].filter(Boolean).join("، ")}
          </span>
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {labels.guests}
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="h-4 w-4" />
            {labels.bedrooms}
          </span>
        </div>
        <p className="pt-1">
          <span className="text-lg font-bold text-primary">
            {formatSAR(unit.pricing.nightly, locale)}
          </span>{" "}
          <span className="text-sm text-muted-foreground">{labels.perNight}</span>
        </p>
      </div>
    </Link>
  );
}
