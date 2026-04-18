import type { Dictionary } from "@/i18n";

/**
 * Scene 2 content — skills display. Rendered inside the third scene of
 * `SceneController` once the user scrolls down from the presentation text.
 *
 * Skill labels themselves are tech terms (React, Next.js, TypeScript…)
 * and intentionally NOT translated — they read the same in every locale.
 * The section label ("Skills") is pulled from the dictionary so the PT
 * side can swap in "Habilidades" later if the user decides to localize it
 * (currently both sides say "Skills" — it's a tech term even in PT copy).
 */
const SKILLS = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Tailwind CSS",
  "PostgreSQL",
  "Supabase",
  "Docker",
];

interface SkillsGridProps {
  dict: Dictionary["skills"];
}

export function SkillsGrid({ dict }: SkillsGridProps) {
  return (
    <div
      className="reveal flex flex-col items-center gap-6"
      style={{ ["--reveal-i" as string]: 0 }}
    >
      <p className="mono text-message uppercase tracking-widest text-(--color-accent) opacity-70">
        {dict.title}
      </p>
      <ul className="flex flex-wrap justify-center gap-3 md:gap-4">
        {SKILLS.map((skill) => (
          <li
            key={skill}
            className="glow-stroke border border-border px-4 py-2 text-click uppercase tracking-[0.04em] text-(--color-accent)"
          >
            {skill}
          </li>
        ))}
      </ul>
    </div>
  );
}
