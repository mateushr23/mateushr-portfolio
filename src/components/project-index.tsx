import type { Database } from "@/types/database";

import { IndexRow } from "./index-row";

type Repo = Database["public"]["Tables"]["repos"]["Row"];

interface ProjectIndexProps {
  repos: Repo[];
}

const EMPTY_LIST_FALLBACK = "índice em construção — voltando em breve.";

/**
 * ProjectIndex — editorial numbered index of repos. Renders an <ol> (not a
 * card grid). When the array is empty (fetch error or all hidden), renders
 * a dignified mono caption rather than an error state.
 */
export function ProjectIndex({ repos }: ProjectIndexProps) {
  return (
    <section
      id="projetos"
      aria-labelledby="projetos-label"
      className="mx-auto max-w-[1100px] px-5 py-24 md:px-12 md:py-40"
    >
      <p
        id="projetos-label"
        className="eyebrow reveal mb-12 md:mb-16"
        style={{ "--reveal-i": 4 } as React.CSSProperties}
      >
        TRABALHO RECENTE · 2026
      </p>

      {repos.length === 0 ? (
        <p
          className="reveal font-mono text-sm text-text-muted"
          style={{ "--reveal-i": 6 } as React.CSSProperties}
        >
          {EMPTY_LIST_FALLBACK}
        </p>
      ) : (
        <ol role="list" className="flex flex-col">
          {repos.map((repo, index) => (
            <IndexRow key={repo.github_id} repo={repo} index={index} />
          ))}
        </ol>
      )}
    </section>
  );
}
