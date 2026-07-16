"use client";

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Props = {
  children: ReactNode;
  /** Accessible label for the scroller */
  label: string;
  className?: string;
  /** Tailwind width classes for each slide */
  slideClassName?: string;
};

export function HorizontalSlider({
  children,
  label,
  className = "",
  slideClassName = "w-[min(88vw,36rem)] md:w-[min(72vw,42rem)]",
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const slides = Children.toArray(children);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const scrolled = el.scrollLeft > 12;
    setCanPrev(scrolled);
    setCanNext(max > 12 && el.scrollLeft < max - 12);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
      ro.disconnect();
    };
  }, [updateEdges, slides.length]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>("[data-slide]");
    const amount = slide ? slide.offsetWidth + 20 : el.clientWidth * 0.75;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollerRef}
        role="region"
        aria-label={label}
        className="slider-scroller flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((child, i) => (
          <div
            key={i}
            data-slide
            className={`shrink-0 snap-start ${slideClassName}`}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Before scroll: only the right arrow. After scroll: both. */}
      {canPrev && (
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollByDir(-1)}
          className="absolute left-[max(0.75rem,calc(var(--shell-gutter)-0.25rem))] top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-sm bg-mist text-ink md:grid"
        >
          <Chevron dir="left" />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollByDir(1)}
          className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-sm bg-mist text-ink md:grid lg:right-5"
        >
          <Chevron dir="right" />
        </button>
      )}
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={dir === "left" ? "rotate-180" : ""}
    >
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
