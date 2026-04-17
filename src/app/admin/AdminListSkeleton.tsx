/**
 * AdminListSkeleton — Suspense fallback for AdminRepoList. Matches the
 * 10-row grid exactly (height + columns) so there's no CLS when the real
 * list hydrates. No shimmer, no pulse — filled blocks would violate the
 * editorial "no card soup" rule; the real UI has no filled boxes either.
 */
const SKELETON_ROWS = 10;

export function AdminListSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-8">
      <p className="mono text-message uppercase tracking-widest text-(--color-accent)/40">
        REPOS · -- TOTAL · -- OCULTOS
      </p>
      <div className="mono hidden grid-cols-[48px_1fr_120px_120px_80px] gap-6 border-b border-border px-2 pb-3 text-[0.7rem] uppercase tracking-[0.08em] text-(--color-accent)/40 md:grid">
        <span>NUM</span>
        <span>NOME</span>
        <span className="text-center">DESTAQUE</span>
        <span className="text-center">OCULTO</span>
        <span className="justify-self-end">GITHUB</span>
      </div>
      <ol role="list" className="flex flex-col">
        {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
          <li key={i} className="border-b border-border">
            <div className="grid min-h-20 grid-cols-1 items-center gap-4 px-2 py-5 md:grid-cols-[48px_1fr_120px_120px_80px] md:gap-6 md:py-6">
              <span className="mono hidden text-sm text-(--color-accent)/40 md:inline">--</span>
              <span className="mono text-sm text-(--color-accent)/40">--</span>
              <span className="mono hidden text-sm text-(--color-accent)/40 md:inline md:text-center">
                --
              </span>
              <span className="mono hidden text-sm text-(--color-accent)/40 md:inline md:text-center">
                --
              </span>
              <span className="mono hidden text-sm text-(--color-accent)/40 md:inline md:justify-self-end">
                --
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
