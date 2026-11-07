import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  showWordmark = true,
  size = 36,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* Prefer the provided Stayro mark; SVG fallback stays crisp at any size */}
      <Image
        src="/brand/logo.png"
        alt="Stayro"
        width={size}
        height={size}
        className="rounded-[22%] shadow-sm"
        priority
      />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-xl font-extrabold tracking-tight text-foreground">ستيرو</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Stayro
          </span>
        </span>
      )}
    </span>
  );
}
