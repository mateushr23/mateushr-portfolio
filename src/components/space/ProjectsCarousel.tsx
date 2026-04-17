"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Scene 3 projects carousel. Replaces the invite card after the user clicks
 * "Ver projetos". Two arrow buttons cycle through the project list with
 * wrap-around; the card content is wrapped in `aria-live="polite"` so screen
 * readers announce each project as the index changes.
 *
 * Loose coupling: the parent `ProjectsScene` owns the view toggle; this
 * component only owns the current index.
 */

type Project = { title: string; description: string; stack: string[]; href?: string };

// TODO(user): confirmar descrição e stack de `doctalk` (URL já configurada).
//             Se `doctalk` tiver demo pública, trocar o href do GitHub pela URL da demo.
const PROJECTS: Project[] = [
  {
    title: "proposal-ai",
    description:
      "Gerador de propostas comerciais com IA — integra Groq para redação e Postgres para persistência.",
    stack: ["React", "Express", "Groq", "Postgres", "Docker"],
    href: "https://github.com/mateushr23/proposal-ai",
  },
  {
    title: "task-agent",
    description:
      "Agente de automação de tarefas com IA — usa Groq para raciocínio, DuckDuckGo para busca e SSE para streaming.",
    stack: ["Node.js", "Groq", "DuckDuckGo", "SSE"],
    href: "https://github.com/mateushr23/task-agent",
  },
  {
    title: "doctalk",
    // TODO(user): substituir pela descrição real do projeto
    description: "Placeholder — aguardando descrição do projeto.",
    // TODO(user): confirmar stack real
    stack: ["TBD"],
    href: "https://github.com/mateushr23/doctalk",
  },
];

export function ProjectsCarousel() {
  const [index, setIndex] = useState(0);

  const total = PROJECTS.length;
  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(total - 1, i + 1));

  const current = PROJECTS[index];

  return (
    <div className="relative flex w-full max-w-container items-center justify-center gap-6 md:gap-10">
      <button
        type="button"
        onClick={prev}
        disabled={index === 0}
        aria-disabled={index === 0}
        aria-label="Projeto anterior"
        className="shrink-0 opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Image
          src="/assets/space/arrow-glyph.svg"
          alt=""
          width={53}
          height={105}
          className="h-12 w-auto md:h-16"
        />
      </button>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="flex min-w-0 flex-1 flex-col items-center gap-5 text-center"
      >
        {/*
          `key={index}` remounts the card on each index change so the
          `reveal` entrance animation restarts and the new project visibly
          fades in — no useEffect plumbing needed.
        */}
        <div
          key={index}
          className="reveal flex flex-col items-center gap-5"
          style={{ ["--reveal-i" as string]: 0 }}
        >
          <p
            aria-hidden="true"
            className="mono text-message uppercase tracking-widest text-(--color-accent)/60"
          >
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
          <h3 className="text-balance font-display text-name font-semibold uppercase leading-tight tracking-[0.025em] text-(--color-accent)">
            {current.href ? (
              <a
                href={current.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-(--color-accent) transition-colors hover:text-accent-bright"
              >
                {current.title}
              </a>
            ) : (
              current.title
            )}
          </h3>
          <p className="max-w-[48ch] text-(length:--text-body) leading-relaxed text-(--color-accent)">
            {current.description}
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {current.stack.map((tech) => (
              <li
                key={tech}
                className="glow-stroke border border-border px-4 py-2 text-click uppercase tracking-[0.04em] text-(--color-accent)"
              >
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={next}
        disabled={index === total - 1}
        aria-disabled={index === total - 1}
        aria-label="Próximo projeto"
        className="shrink-0 opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Image
          src="/assets/space/arrow-glyph.svg"
          alt=""
          width={53}
          height={105}
          className="h-12 w-auto rotate-180 md:h-16"
        />
      </button>
    </div>
  );
}
