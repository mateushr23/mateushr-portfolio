"use client";

import Image from "next/image";

/**
 * Scene 3 invitation card. Now a Client Component because the CTA is a
 * button that flips a local view state in the parent `ProjectsScene`
 * (no navigation — the projects carousel mounts in-place and slides in).
 *
 * TODO(user): supply the real invitation copy.
 */

type ProjectsInviteProps = {
  onEnter: () => void;
};

export function ProjectsInvite({ onEnter }: ProjectsInviteProps) {
  return (
    <div
      className="reveal flex max-w-container flex-col items-center gap-8 text-center"
      style={{ ["--reveal-i" as string]: 0 }}
    >
      {/* TODO(user): substitua pelo texto real do convite */}
      <p className="text-balance font-display text-name font-semibold uppercase leading-tight tracking-[0.025em] text-(--color-accent)">
        Que tal dar uma olhada nos projetos?
      </p>
      <button
        type="button"
        onClick={onEnter}
        className="label inline-flex items-center gap-4 text-corner uppercase tracking-[0.08em] text-(--color-accent) transition-colors hover:text-accent-bright"
      >
        <span>Ver projetos</span>
        <Image
          src="/assets/space/arrow-glyph.svg"
          alt=""
          width={53}
          height={105}
          aria-hidden="true"
          className="h-6 w-auto shrink-0 rotate-180 md:h-7"
        />
      </button>
    </div>
  );
}
