"use client";

import { useEffect, useState } from "react";

import { ProjectsCarousel, type CarouselRepo } from "./ProjectsCarousel";
import { ProjectsInvite } from "./ProjectsInvite";

/**
 * Scene 3 sub-state machine. Holds `view = 'invite' | 'projects'` and
 * cross-slides between the invitation card and the projects carousel.
 *
 * The invite sits at `translateX(0)` and slides off to the LEFT when the
 * user clicks "Ver projetos"; the carousel starts at `translateX(100%)`
 * (off-screen right) and slides in from the right to `translateX(0)`.
 *
 * Side effects:
 *  - On every `view` change, dispatches a `projects:view` CustomEvent so
 *    `SocialRail` can reposition its icons (loose coupling, matches the
 *    `scene:change` pattern used elsewhere).
 *  - Listens for `scene:change`; when the active scene leaves 3, the view
 *    resets to `'invite'` so re-entering scene 3 shows the invitation first.
 *  - Each time the user opens the carousel, `openCount` increments and is
 *    used as the carousel's `key` so it remounts fresh (internal index → 0).
 *
 * The globe does NOT rotate during the invite → carousel swap — rotation
 * stays per-scene (owned by `SceneController`).
 */

const TRANSITION_MS = 700;

interface ProjectsSceneProps {
  repos: CarouselRepo[];
}

export function ProjectsScene({ repos }: ProjectsSceneProps) {
  const [view, setView] = useState<"invite" | "projects">("invite");
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("projects:view", {
        detail: { active: view === "projects" },
      })
    );
  }, [view]);

  const openProjects = () => {
    setOpenCount((n) => n + 1);
    setView("projects");
  };

  useEffect(() => {
    const onSceneChange = (e: Event) => {
      const detail = (e as CustomEvent<{ scene: number }>).detail;
      if (detail && typeof detail.scene === "number" && detail.scene !== 3) {
        setView("invite");
      }
    };
    window.addEventListener("scene:change", onSceneChange as EventListener);
    return () => {
      window.removeEventListener("scene:change", onSceneChange as EventListener);
    };
  }, []);

  const isInvite = view === "invite";
  const isProjects = view === "projects";

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="absolute inset-0 flex items-center justify-center transition-all"
        style={{
          transitionDuration: `${TRANSITION_MS}ms`,
          opacity: isInvite ? 1 : 0,
          transform: isInvite ? "translateX(0)" : "translateX(-100%)",
          pointerEvents: isInvite ? "auto" : "none",
        }}
        aria-hidden={!isInvite}
      >
        <ProjectsInvite onEnter={openProjects} />
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center transition-all"
        style={{
          transitionDuration: `${TRANSITION_MS}ms`,
          opacity: isProjects ? 1 : 0,
          transform: isProjects ? "translateX(0)" : "translateX(100%)",
          pointerEvents: isProjects ? "auto" : "none",
        }}
        aria-hidden={!isProjects}
      >
        <ProjectsCarousel key={openCount} repos={repos} />
      </div>
    </div>
  );
}
