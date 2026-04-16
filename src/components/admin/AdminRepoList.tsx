import { toggleFeatured, toggleHidden } from "@/app/admin/actions";
import type { Database } from "@/types/database";

import { AdminRepoRow } from "./AdminRepoRow";
import { EmptyAdminState } from "./EmptyAdminState";

type Repo = Database["public"]["Tables"]["repos"]["Row"];

interface AdminRepoListProps {
  repos: Repo[];
}

/**
 * AdminRepoList — the full admin table. Sort order: is_hidden ASC then
 * pushed_at DESC, so visible repos come first and the admin reviews the
 * active index before the hidden archive.
 *
 * Per-row toggles are bound server actions — each row gets its own
 * .bind()'d closures with the repo id pre-applied, so the client-side
 * ToggleSwitch only sees `(next: boolean) => Promise<void>`. Server-side
 * re-verification still runs (see actions.ts assertAdmin).
 */
export function AdminRepoList({ repos }: AdminRepoListProps) {
  if (repos.length === 0) {
    return <EmptyAdminState />;
  }

  const sorted = [...repos].sort((a, b) => {
    if (a.is_hidden !== b.is_hidden) return a.is_hidden ? 1 : -1;
    return (b.pushed_at ?? "").localeCompare(a.pushed_at ?? "");
  });

  const hiddenCount = sorted.filter((r) => r.is_hidden).length;

  return (
    <div className="flex flex-col gap-8">
      <p className="eyebrow">
        REPOS · {sorted.length} TOTAL · {hiddenCount} OCULTOS
      </p>

      {/* Header row — hidden on mobile where each row is already labelled. */}
      <div
        aria-hidden="true"
        className="hidden grid-cols-[48px_1fr_120px_120px_80px] gap-6 border-b border-border px-2 pb-3 font-mono text-[0.7rem] uppercase tracking-[0.08em] text-text-dim md:grid"
      >
        <span>NUM</span>
        <span>NOME</span>
        <span className="text-center">DESTAQUE</span>
        <span className="text-center">OCULTO</span>
        <span className="justify-self-end">GITHUB</span>
      </div>

      <ol role="list" className="flex flex-col">
        {sorted.map((repo, index) => {
          // .bind() preserves server-action semantics when the closure is
          // passed across the RSC→Client boundary. The ToggleSwitch's
          // onToggle prop accepts Promise<unknown> because it only cares
          // whether the action resolved — the { ok: boolean } result is
          // ignored client-side (server re-verifies + revalidates path).
          const boundFeatured = toggleFeatured.bind(null, repo.id);
          const boundHidden = toggleHidden.bind(null, repo.id);
          return (
            <AdminRepoRow
              key={repo.id}
              repo={repo}
              index={index}
              onToggleFeatured={boundFeatured}
              onToggleHidden={boundHidden}
            />
          );
        })}
      </ol>
    </div>
  );
}
