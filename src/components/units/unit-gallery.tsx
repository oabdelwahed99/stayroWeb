"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Labels = {
  showAll: string;
  close: string;
  prev: string;
  next: string;
};

export function UnitGallery({
  photoIds,
  title,
  rtl,
  labels,
}: {
  photoIds: string[];
  title: string;
  rtl: boolean;
  labels: Labels;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);
  const count = photoIds.length;
  const open = index !== null;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + count) % count)),
    [count]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const forward = e.key === (rtl ? "ArrowLeft" : "ArrowRight");
      go(forward ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, rtl, go]);

  useEffect(() => {
    if (index === null) return;
    document
      .getElementById(`gallery-thumb-${index}`)
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  if (count === 0) return null;

  const [cover, ...rest] = photoIds;
  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <>
      <div
        className={cn(
          "relative mt-6 grid gap-2 overflow-hidden rounded-2xl",
          rest.length > 0 ? "md:grid-cols-4 md:grid-rows-2" : ""
        )}
      >
        <button
          type="button"
          onClick={() => setIndex(0)}
          aria-label={`${title} 1`}
          className={cn(
            "group relative aspect-[4/3] cursor-zoom-in overflow-hidden bg-muted md:aspect-auto",
            rest.length > 0 ? "md:col-span-2 md:row-span-2 md:min-h-[420px]" : "md:min-h-[420px]"
          )}
        >
          <Image
            src={`/api/photos/${cover}`}
            alt={title}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </button>
        {rest.slice(0, 4).map((photoId, i) => (
          <button
            type="button"
            key={photoId}
            onClick={() => setIndex(i + 1)}
            aria-label={`${title} ${i + 2}`}
            className={cn(
              "group relative hidden aspect-[4/3] cursor-zoom-in overflow-hidden bg-muted md:block md:aspect-auto",
              rest.length <= 2 && "md:row-span-2",
              rest.length === 1 && "md:col-span-2"
            )}
          >
            <Image
              src={`/api/photos/${photoId}`}
              alt={`${title} ${i + 2}`}
              fill
              sizes="25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </button>
        ))}
        {count > 1 && (
          <button
            type="button"
            onClick={() => setIndex(0)}
            className="absolute bottom-3 end-3 flex items-center gap-2 rounded-lg border bg-background/90 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur hover:bg-background"
          >
            <Images className="h-4 w-4" />
            {labels.showAll}
          </button>
        )}
      </div>

      <Dialog.Root open={open} onOpenChange={(o) => !o && setIndex(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/95" />
          <Dialog.Content
            dir={rtl ? "rtl" : "ltr"}
            aria-describedby={undefined}
            className="fixed inset-0 z-50 flex flex-col text-white outline-none"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) < 50) return;
              const swipedLeft = dx < 0;
              go(swipedLeft !== rtl ? 1 : -1);
            }}
          >
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            <div className="flex items-center justify-between p-4">
              <span dir="ltr" className="text-sm tabular-nums text-white/80">
                {(index ?? 0) + 1} / {count}
              </span>
              <Dialog.Close
                aria-label={labels.close}
                className="rounded-full p-2 hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </Dialog.Close>
            </div>

            <div className="relative flex-1">
              {index !== null && (
                <Image
                  key={photoIds[index]}
                  src={`/api/photos/${photoIds[index]}`}
                  alt={`${title} ${index + 1}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              )}
              {count > 1 && (
                <>
                  <button
                    type="button"
                    aria-label={labels.prev}
                    onClick={() => go(-1)}
                    className="absolute start-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20 md:start-6"
                  >
                    <PrevIcon className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    aria-label={labels.next}
                    onClick={() => go(1)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20 md:end-6"
                  >
                    <NextIcon className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {count > 1 && (
              <div className="flex justify-center gap-2 overflow-x-auto p-4">
                {photoIds.map((photoId, i) => (
                  <button
                    type="button"
                    key={photoId}
                    id={`gallery-thumb-${i}`}
                    onClick={() => setIndex(i)}
                    aria-label={`${title} ${i + 1}`}
                    aria-current={i === index}
                    className={cn(
                      "relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-opacity",
                      i === index ? "border-primary opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                    )}
                  >
                    <Image
                      src={`/api/photos/${photoId}?size=thumb`}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
