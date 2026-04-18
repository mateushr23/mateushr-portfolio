import type { Database } from "@/types/database";
import { safeRepoHref } from "@/lib/safe-url";

type Repo = Database["public"]["Tables"]["repos"]["Row"];

interface IndexRowProps {
  repo: Repo;
  index: number;
}

const EMPTY_DESCRIPTION = "Projeto em TypeScript — descrição em breve.";

const pushedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

function formatPushedAt(pushedAt: string): string {
  const date = new Date(pushedAt);
  if (Number.isNaN(date.getTime())) return "";
  return pushedAtFormatter.format(date);
}

/**
 * IndexRow — a single row in the editorial project index. The whole row is
 * a single <a> so the entire strip is one focus target and one click target.
 * Hover/focus animations live in globals.css via the `.index-row` group:
 *   - .name-link underline grows left-to-right
 *   - .index-num color shifts to accent
 *   - .index-arrow translates +4px on the x-axis
 *
 * Layout: desktop grid [64px number | 1fr name+meta+desc | 48px arrow].
 * Mobile collapses to a single column and renders the arrow inline.
 */
export function IndexRow({ repo, index }: IndexRowProps) {
  const number = String(index + 1).padStart(2, "0");
  const description = repo.description_pt ?? EMPTY_DESCRIPTION;
  const language = repo.language ?? "TypeScript";
  const pushedAtLabel = formatPushedAt(repo.pushed_at);
  // safeRepoHref only returns http(s) URLs that parse cleanly. When the DB
  // row has something unexpected (null, javascript:, malformed) the link
  // falls back to "#" and is marked aria-disabled so it's still readable
  // but not interactive.
  const safeHrefValue = safeRepoHref(repo.url);
  const hasSafeHref = safeHrefValue !== undefined;

  return (
    <li
      className="reveal border-b border-border"
      style={{ "--reveal-i": 5 + index } as React.CSSProperties}
    >
      <a
        href={hasSafeHref ? safeHrefValue : "#"}
        {...(hasSafeHref
          ? { target: "_blank", rel: "noopener noreferrer" }
          : { "aria-disabled": true, tabIndex: -1 })}
        className="index-row grid min-h-24 grid-cols-1 items-baseline gap-4 py-8 md:grid-cols-[64px_1fr_48px] md:gap-8"
      >
        <span aria-hidden="true" className="index-num font-display text-[2.25rem] leading-none">
          {number}
        </span>

        <div className="flex flex-col gap-3">
          <h2 className="font-display text-h2 italic leading-[1.05] text-text">
            <span className="name-link">{repo.name}</span>
          </h2>

          <p className="font-mono text-[0.8125rem] tracking-[0.04em] text-text-muted">
            {language}
            {pushedAtLabel ? ` · ${pushedAtLabel}` : ""}
            {repo.stars > 0 ? ` · ★ ${repo.stars}` : ""}
          </p>

          <p className="max-w-[62ch] text-base leading-[1.65] tracking-[-0.005em] text-text-muted">
            {description}
          </p>
        </div>

        <span
          aria-hidden="true"
          className="index-arrow justify-self-start text-text-dim md:justify-self-end"
        >
          →
        </span>
      </a>
    </li>
  );
}
