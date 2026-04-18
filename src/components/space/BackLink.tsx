"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { Dictionary } from "@/i18n";

/**
 * Top-left "back" button, visible only on scene 4 (ContactForm).
 *
 * Uses the shared `arrow-glyph.svg` asset in its native orientation
 * (points LEFT). Mirrors `ContactLink`'s fixed corner placement on the
 * opposite side.
 *
 * Behaviour: tracks the LAST non-4 scene the user was on via the
 * `scene:change` CustomEvent; clicking dispatches `scene:goto` back to
 * that scene so the user returns to where they came from. If the user
 * landed directly on scene 4 with no prior history, falls back to
 * scene 0 (initial state of `prevScene`).
 *
 * Renders `null` when scene !== 4 (same unmount pattern as NavCTAs-like
 * rails), which is simpler than an opacity fade and avoids invisible
 * click targets.
 */
interface BackLinkProps {
  dict: Dictionary["contact"];
}

export function BackLink({ dict }: BackLinkProps) {
  const [scene, setScene] = useState(0);
  const [prevScene, setPrevScene] = useState(0);

  useEffect(() => {
    const onSceneChange = (e: Event) => {
      const detail = (e as CustomEvent<{ scene: number }>).detail;
      if (!detail || typeof detail.scene !== "number") return;
      if (detail.scene !== 4) {
        setPrevScene(detail.scene);
      }
      setScene(detail.scene);
    };
    window.addEventListener("scene:change", onSceneChange as EventListener);
    return () => {
      window.removeEventListener("scene:change", onSceneChange as EventListener);
    };
  }, []);

  if (scene !== 4) return null;

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("scene:goto", { detail: { scene: prevScene } }));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="label fixed left-6 top-6 z-30 inline-flex items-center gap-4 text-corner uppercase tracking-[0.08em] text-(--color-accent) opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100 md:left-12 md:top-10"
    >
      <Image
        src="/assets/space/arrow-glyph.svg"
        alt=""
        width={53}
        height={105}
        aria-hidden="true"
        className="h-6 w-auto shrink-0 md:h-7"
      />
      <span>{dict.back}</span>
    </button>
  );
}
