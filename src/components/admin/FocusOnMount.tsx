"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface FocusOnMountProps {
  children: ReactNode;
  /** Wrapper element tag. "span" stays inline, "div" for block contexts. */
  as?: "span" | "div";
  className?: string;
}

/**
 * Focuses the first focusable descendant on mount. Used to:
 *   - announce the AuthDeniedBanner (role=alert) on arrival
 *   - move focus onto the "enviar novo link" anchor after the
 *     confirmation page loads
 *
 * Implemented as a passthrough wrapper because we need a DOM handle from a
 * Server Component parent but the target element is the child. We pick the
 * first focusable descendant (anchor, button, or element with tabindex >= -1).
 */
export function FocusOnMount({ children, as = "span", className }: FocusOnMountProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = as === "div" ? divRef.current : spanRef.current;
    if (!node) return;
    // tabindex="-1" IS included — role=alert banners use it to be
    // programmatically focusable without entering the tab order.
    const target = node.querySelector<HTMLElement>("a[href], button, [tabindex]");
    target?.focus();
  }, [as]);

  if (as === "div") {
    return (
      <div ref={divRef} className={className}>
        {children}
      </div>
    );
  }
  return (
    <span ref={spanRef} className={className}>
      {children}
    </span>
  );
}
