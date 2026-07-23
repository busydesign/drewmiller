"use client";

import { useEffect } from "react";

const SELECTOR =
  "main section:not([data-reveal-skip]), [data-reveal], [data-reveal-stagger]";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function markRevealed(el: Element) {
  el.classList.add("is-revealed");
}

export function ScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-enabled");
    root.classList.remove("reveal-pending");

    // Keep admin tooling static — never leave it stuck at opacity 0
    if (window.location.pathname.startsWith("/admin")) {
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        el.classList.add("reveal-ready", "is-revealed");
      });
      return;
    }

    const nodes = () =>
      Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));

    if (prefersReducedMotion()) {
      nodes().forEach((el) => {
        el.classList.add("reveal-ready", "is-revealed");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          markRevealed(entry.target);
          observer.unobserve(entry.target);
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12,
      }
    );

    const observeAll = () => {
      for (const el of nodes()) {
        if (el.classList.contains("is-revealed")) continue;
        if (el.dataset.revealBound === "1") continue;
        el.dataset.revealBound = "1";
        el.classList.add("reveal-ready");

        // Already in view on load (e.g. stats under hero)
        const rect = el.getBoundingClientRect();
        const inView =
          rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
        if (inView) {
          // Small delay so first paint can settle
          requestAnimationFrame(() => markRevealed(el));
        } else {
          observer.observe(el);
        }
      }
    };

    observeAll();

    const mo = new MutationObserver(() => observeAll());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
