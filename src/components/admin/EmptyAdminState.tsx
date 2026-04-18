import { refreshRepos } from "@/app/admin/actions";

import { RefreshButton } from "./RefreshButton";

/**
 * EmptyAdminState — rendered when zero repos are in the DB. Editorial and
 * quiet: mono eyebrow, italic heading, instructions, then the same refresh
 * button from the toolbar so the admin can trigger the first sync without
 * scrolling away.
 */
export function EmptyAdminState() {
  return (
    <div className="flex flex-col gap-6 py-16 text-center md:items-center">
      <p className="mono text-message uppercase tracking-widest text-(--color-accent) opacity-70">
        ÍNDICE VAZIO
      </p>
      <h2 className="font-display text-name uppercase leading-tight tracking-[0.025em] text-(--color-accent)">
        nenhum repo indexado
      </h2>
      <p className="max-w-[48ch] text-message leading-[1.65] text-(--color-accent)/80">
        Clique atualizar agora para buscar repos públicos do GitHub.
      </p>
      <div className="mt-2">
        <RefreshButton action={refreshRepos} />
      </div>
    </div>
  );
}
