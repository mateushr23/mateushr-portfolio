/**
 * Centerpiece h1 "HELLO FELLOW GALAXY MEMBER" flanked above and below
 * by the "A MESSAGE FROM EARTH" mono markers (top-aligned to the right,
 * bottom-aligned to the left — mirrored per handoff).
 */
function MessageMarker({ side }: { side: "top" | "bottom" }) {
  const textFirst = side === "bottom";
  return (
    <div
      className="mono flex w-full items-center gap-4 text-message uppercase tracking-[0.08em] text-(--color-accent)"
      aria-hidden="true"
    >
      {textFirst ? (
        <>
          <span>A MESSAGE FROM EARTH</span>
          <span className="h-px flex-1 bg-(--color-accent) opacity-30" />
        </>
      ) : (
        <>
          <span className="h-px flex-1 bg-(--color-accent) opacity-30" />
          <span>A MESSAGE FROM EARTH</span>
        </>
      )}
    </div>
  );
}

export function GalaxyHeadline() {
  return (
    <div
      className="reveal flex w-full flex-col items-center gap-5"
      style={{ ["--reveal-i" as string]: 0 }}
    >
      <div className="flex w-full flex-col items-stretch gap-5 md:w-fit">
        <MessageMarker side="top" />
        <h1 className="text-balance text-center font-display text-hero font-bold uppercase leading-none tracking-[0.025em] text-(--color-accent) whitespace-normal md:whitespace-nowrap">
          Hello fellow galaxy member
        </h1>
        <MessageMarker side="bottom" />
      </div>
    </div>
  );
}
