"use client";

import { useEffect, useState, useTransition } from "react";

type RefreshResult = { ok: boolean; count?: number; error?: string };

interface RefreshButtonProps {
  action: () => Promise<RefreshResult>;
}

type Phase = "idle" | "pending" | "success" | "error";

/**
 * RefreshButton — triggers the GitHub sync server action. Editorial
 * non-card look: amber left border + mono label (never a filled box).
 *
 * useTransition keeps the button reactive while the action runs. Phase
 * governs label + color; a sibling aria-live region announces each phase
 * for screen readers. Success resets to idle after 3 seconds so the admin
 * isn't stuck looking at a stale "updated" state if they glance back.
 */
export function RefreshButton({ action }: RefreshButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("idle");
  const [resultCount, setResultCount] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== "success" && phase !== "error") return;
    const t = setTimeout(() => {
      setPhase("idle");
      setResultCount(null);
    }, 3000);
    return () => clearTimeout(t);
  }, [phase]);

  function handleClick() {
    setPhase("pending");
    setResultCount(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          setPhase("error");
          return;
        }
        setResultCount(result.count ?? 0);
        setPhase("success");
      } catch (err) {
        console.error("[RefreshButton] action failed", err);
        setPhase("error");
      }
    });
  }

  const busy = isPending || phase === "pending";

  const label = (() => {
    if (busy) return "buscando no github…";
    if (phase === "success") return `atualizado · ${resultCount ?? 0} repos`;
    if (phase === "error") return "falhou — tentar novamente";
    return "atualizar agora";
  })();

  const liveLabel = (() => {
    if (busy) return "Buscando repositórios…";
    if (phase === "success") return `Atualizado: ${resultCount ?? 0} repos.`;
    if (phase === "error") return "Falha ao atualizar.";
    return "";
  })();

  const toneClass = (() => {
    if (phase === "success") return "text-[color:var(--color-success)]";
    if (phase === "error") return "text-[color:var(--color-danger)]";
    return "text-text";
  })();

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-busy={busy}
        className={`inline-flex items-center gap-2 border-l-2 border-accent py-3 pl-3 pr-1 font-mono text-sm transition-colors duration-200 hover:text-accent disabled:cursor-wait ${toneClass}`}
      >
        <span aria-hidden="true" className="refresh-glyph" data-busy={busy ? "true" : "false"}>
          ↻
        </span>
        <span>{label}</span>
      </button>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveLabel}
      </span>
    </div>
  );
}
