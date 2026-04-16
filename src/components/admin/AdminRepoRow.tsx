import type { Database } from "@/types/database";
import { safeRepoHref } from "@/lib/safe-url";

import { ToggleSwitch } from "./ToggleSwitch";

type Repo = Database["public"]["Tables"]["repos"]["Row"];

interface AdminRepoRowProps {
  repo: Repo;
  index: number;
  onToggleFeatured: (next: boolean) => Promise<unknown>;
  onToggleHidden: (next: boolean) => Promise<unknown>;
}

const pushedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "numeric",
});

function formatPushedAt(pushedAt: string): string {
  const date = new Date(pushedAt);
  if (Number.isNaN(date.getTime())) return "";
  return pushedAtFormatter.format(date);
}

/**
 * AdminRepoRow — editorial row adapted for admin controls. Unlike the
 * public IndexRow we do NOT wrap the whole thing in an <a>, because the
 * toggles need their own click targets. Only the repo name is an anchor
 * (guarded via safeRepoHref). Hover band uses --color-surface-admin to
 * signal interactivity without introducing a filled card.
 *
 * Desktop grid: [48px num | 1fr name/meta | 120px featured | 120px hidden | 80px github-arrow]
 * Mobile: collapses to two stacked sub-rows — name/meta on top, toggles
 * inline (labels visible) on the second, arrow on the right of the name row.
 */
export function AdminRepoRow({ repo, index, onToggleFeatured, onToggleHidden }: AdminRepoRowProps) {
  const number = String(index + 1).padStart(2, "0");
  const href = safeRepoHref(repo.url);
  const language = repo.language ?? "—";
  const pushedAtLabel = formatPushedAt(repo.pushed_at);

  return (
    <li
      className="group border-b border-border transition-colors duration-200 hover:bg-[color:var(--color-surface-admin)]"
      style={{ "--reveal-i": 5 + index } as React.CSSProperties}
    >
      <div className="grid grid-cols-1 items-center gap-4 px-2 py-5 md:grid-cols-[48px_1fr_120px_120px_80px] md:gap-6 md:py-6">
        <span aria-hidden="true" className="hidden font-mono text-sm text-text-dim md:inline">
          {number}
        </span>

        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-xl italic leading-tight text-text">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="name-link focus:outline-none focus-visible:text-accent"
              >
                {repo.name}
              </a>
            ) : (
              <span aria-disabled="true" className="text-text-muted">
                {repo.name}
              </span>
            )}
          </h2>
          <p className="font-mono text-[0.75rem] tracking-[0.04em] text-text-muted">
            {language}
            {pushedAtLabel ? ` · ${pushedAtLabel}` : ""}
            {repo.stars > 0 ? ` · ★ ${repo.stars}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 md:justify-center">
          <ToggleSwitch
            name={`featured-${repo.id}`}
            defaultChecked={repo.is_featured}
            label="destacar"
            labelHidden
            variant="featured"
            onToggle={onToggleFeatured}
            srOn="Destaque ativado"
            srOff="Destaque desativado"
            srLoading="Salvando…"
          />
          <span className="font-mono text-[0.75rem] text-text-muted md:hidden">destacar</span>
        </div>

        <div className="flex items-center gap-2 md:justify-center">
          <ToggleSwitch
            name={`hidden-${repo.id}`}
            defaultChecked={repo.is_hidden}
            label="ocultar"
            labelHidden
            variant="hidden"
            onToggle={onToggleHidden}
            srOn="Oculto ativado"
            srOff="Oculto desativado"
            srLoading="Salvando…"
          />
          <span className="font-mono text-[0.75rem] text-text-muted md:hidden">ocultar</span>
        </div>

        <div className="md:justify-self-end">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir ${repo.name} no GitHub`}
              className="inline-flex h-11 items-center justify-center px-3 font-mono text-sm text-text-dim transition-colors duration-200 hover:text-accent"
            >
              <span aria-hidden="true">→</span>
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}
