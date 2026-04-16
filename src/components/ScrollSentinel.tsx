"use client";

import { useEffect, useRef } from "react";

interface ScrollSentinelProps {
  /** ID of the element whose `data-scrolled` attribute should toggle when the sentinel leaves the viewport. */
  targetId: string;
}

/**
 * ScrollSentinel — renders a zero-height div at the top of the page and uses
 * IntersectionObserver to toggle `data-scrolled="true"` on the element with
 * the given id whenever the user scrolls past the sentinel (20px threshold).
 *
 * This deliberately mutates the target's attribute via DOM rather than lifting
 * state up, so the SiteHeader can remain a Server Component. We avoid scroll
 * event listeners (continuous reflows) and use a single-shot IntersectionObserver.
 */
export function ScrollSentinel({ targetId }: ScrollSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        target.dataset.scrolled = String(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-20px 0px 0px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [targetId]);

  return <div ref={ref} aria-hidden="true" className="absolute top-0 h-px w-full" />;
}
