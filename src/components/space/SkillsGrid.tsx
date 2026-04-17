/**
 * Scene 2 content — skills display. Rendered inside the third scene of
 * `SceneController` once the user scrolls down from the presentation text.
 *
 * TODO(user): replace the placeholder skill list below with Mateus's real
 * stack (frameworks, languages, databases, tooling). Labels are uppercase
 * to match the Anima reference's mono/tracking treatment.
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

export function SkillsGrid() {
  return (
    <div
      className="reveal flex flex-col items-center gap-6"
      style={{ ["--reveal-i" as string]: 0 }}
    >
      <p className="mono text-message uppercase tracking-widest text-(--color-accent) opacity-70">
        Skills
      </p>
      {/* TODO(user): substitua pela sua lista real de skills */}
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
