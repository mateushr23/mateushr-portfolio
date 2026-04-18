import type { Dictionary } from "@/i18n";

/**
 * Centerpiece h1 "HELLO FELLOW GALAXY MEMBER" flanked above and below
 * by the "A MESSAGE FROM EARTH" mono markers (top-aligned to the right,
 * bottom-aligned to the left — mirrored per handoff).
 *
 * Now takes a `dict` slice so the PT and EN routes render their locale's
 * headline without duplicating the markup. The marker text itself stays
 * in English on both sides (it's the wordmark motif of the design).
 */
function MessageMarker({ side, label }: { side: "top" | "bottom"; label: string }) {
  const textFirst = side === "bottom";
  return (
    <div
      className="mono flex w-full items-center gap-4 text-message uppercase tracking-[0.08em] text-(--color-accent)"
      aria-hidden="true"
    >
      {textFirst ? (
        <>
          <span>{label}</span>
          <span className="h-px flex-1 bg-(--color-accent) opacity-30" />
        </>
      ) : (
        <>
          <span className="h-px flex-1 bg-(--color-accent) opacity-30" />
          <span>{label}</span>
        </>
      )}
    </div>
  );
}

interface GalaxyHeadlineProps {
  dict: Dictionary["hero"];
}

export function GalaxyHeadline({ dict }: GalaxyHeadlineProps) {
  return (
    <div
      className="reveal flex w-full flex-col items-center gap-5"
      style={{ ["--reveal-i" as string]: 0 }}
    >
      <div className="flex w-full flex-col items-stretch gap-5 md:w-fit">
        <MessageMarker side="top" label={dict.messageMarker} />
        <h1 className="text-balance text-center font-display text-hero font-bold uppercase leading-none tracking-[0.025em] text-(--color-accent) whitespace-normal md:whitespace-nowrap">
          {dict.headline}
        </h1>
        <MessageMarker side="bottom" label={dict.messageMarker} />
      </div>
    </div>
  );
}
