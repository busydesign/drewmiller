"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type GalleryImage = {
  id: string;
  url: string;
  alt?: string | null;
};

type Props = {
  images: GalleryImage[];
  title?: string;
};

export function ListingGallery({ images, title = "Gallery" }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const open = useCallback((index: number) => setActiveIndex(index), []);

  const showPrev = useCallback(() => {
    setActiveIndex((current) => {
      if (current == null || images.length === 0) return current;
      return (current - 1 + images.length) % images.length;
    });
  }, [images.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current == null || images.length === 0) return current;
      return (current + 1) % images.length;
    });
  }, [images.length]);

  useEffect(() => {
    if (activeIndex == null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, close, showNext, showPrev]);

  if (images.length === 0) return null;

  const active = activeIndex != null ? images[activeIndex] : null;

  return (
    <div className="mt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="display text-3xl">{title}</h2>
        <p className="text-sm text-ink-soft">
          {images.length} photos · click to enlarge
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => open(index)}
            className="group relative aspect-[4/3] overflow-hidden bg-mist text-left"
            aria-label={`Open photo ${index + 1} of ${images.length}`}
          >
            <Image
              src={image.url}
              alt={image.alt || `Photo ${index + 1}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              unoptimized
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/15" />
          </button>
        ))}
      </div>

      {active && activeIndex != null && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/92 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery lightbox"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center bg-rw-yellow text-ink transition hover:bg-rw-yellow-deep"
            aria-label="Close gallery"
          >
            <X size={22} strokeWidth={2.25} />
          </button>

          <div className="absolute left-4 top-4 z-10 bg-white/10 px-3 py-1.5 text-sm font-bold text-white backdrop-blur">
            {activeIndex + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrev();
                }}
                className="absolute left-3 z-10 grid h-12 w-12 place-items-center bg-white/10 text-white transition hover:bg-rw-yellow hover:text-ink md:left-6"
                aria-label="Previous photo"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                className="absolute right-3 z-10 grid h-12 w-12 place-items-center bg-white/10 text-white transition hover:bg-rw-yellow hover:text-ink md:right-6"
                aria-label="Next photo"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <div
            className="relative h-[min(82vh,860px)] w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={active.url}
              alt={active.alt || `Photo ${activeIndex + 1}`}
              fill
              className="object-contain"
              unoptimized
              priority
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </div>
  );
}
