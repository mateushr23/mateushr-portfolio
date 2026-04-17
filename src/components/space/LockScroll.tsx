"use client";

import { useEffect } from "react";

/** Scopes scroll-lock to routes that opt in (home only). Applies to <html> + <body>. */
export function LockScroll() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("no-scroll");
    body.classList.add("no-scroll");
    return () => {
      html.classList.remove("no-scroll");
      body.classList.remove("no-scroll");
    };
  }, []);
  return null;
}
