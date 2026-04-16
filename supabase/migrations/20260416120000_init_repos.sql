-- =====================================================================
-- Migration: init_repos
-- Purpose:   Create the `public.repos` table that stores a synced view
--            of the portfolio's public GitHub repositories plus
--            Claude-generated PT-BR descriptions and curation flags.
-- Scope:     Read-through for the public site (anon + authenticated),
--            full read/write for authenticated admin (magic-link auth).
--            Daily sync runs with the service_role key (bypasses RLS).
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Table: public.repos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.repos (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id       BIGINT      NOT NULL UNIQUE,
    name            TEXT        NOT NULL,
    description_ai  TEXT,
    language        TEXT,
    stars           INTEGER     NOT NULL DEFAULT 0,
    url             TEXT        NOT NULL,
    pushed_at       TIMESTAMPTZ NOT NULL,
    is_featured     BOOLEAN     NOT NULL DEFAULT FALSE,
    is_hidden       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.repos                 IS 'Synced snapshot of mateushr23 public GitHub repos with curated PT-BR descriptions.';
COMMENT ON COLUMN public.repos.id              IS 'Internal UUID primary key.';
COMMENT ON COLUMN public.repos.github_id       IS 'GitHub repository id (stable across renames). Source of truth for diff/upsert.';
COMMENT ON COLUMN public.repos.name            IS 'Repository name (repo slug, e.g. "mateushr-portfolio").';
COMMENT ON COLUMN public.repos.description_ai  IS 'Claude-generated PT-BR description. Null until the daily sync Routine populates it.';
COMMENT ON COLUMN public.repos.language        IS 'Primary language reported by GitHub (nullable; e.g. "TypeScript").';
COMMENT ON COLUMN public.repos.stars           IS 'Stargazer count at last sync.';
COMMENT ON COLUMN public.repos.url             IS 'Canonical html_url to the repo on GitHub.';
COMMENT ON COLUMN public.repos.pushed_at       IS 'Last push timestamp from GitHub. Used for sort order and change detection.';
COMMENT ON COLUMN public.repos.is_featured     IS 'Admin toggle: pin to the top of the public site.';
COMMENT ON COLUMN public.repos.is_hidden       IS 'Admin toggle: hide from the public site (still visible to admin).';
COMMENT ON COLUMN public.repos.created_at      IS 'Row creation timestamp (server clock).';
COMMENT ON COLUMN public.repos.updated_at      IS 'Auto-bumped on every UPDATE via trigger tg_set_updated_at.';

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
-- Public listing: order by latest activity, skip hidden rows.
CREATE INDEX IF NOT EXISTS idx_repos_visible
    ON public.repos (pushed_at DESC)
    WHERE is_hidden = FALSE;

-- Featured carousel: only pinned rows, sorted by latest activity.
CREATE INDEX IF NOT EXISTS idx_repos_featured
    ON public.repos (pushed_at DESC)
    WHERE is_featured = TRUE;

-- Note: the PRIMARY KEY on id and the UNIQUE on github_id create their
-- own implicit indexes (repos_pkey, repos_github_id_key).

-- ---------------------------------------------------------------------
-- Trigger: auto-bump updated_at on UPDATE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.tg_set_updated_at() IS 'Trigger function: sets NEW.updated_at to NOW() on every UPDATE.';

DROP TRIGGER IF EXISTS repos_set_updated_at ON public.repos;
CREATE TRIGGER repos_set_updated_at
    BEFORE UPDATE ON public.repos
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
ALTER TABLE public.repos ENABLE ROW LEVEL SECURITY;

-- Public site: anon + authenticated see only non-hidden rows.
CREATE POLICY "repos_public_read"
    ON public.repos
    FOR SELECT
    TO anon, authenticated
    USING (is_hidden = FALSE);

-- Admin read: any authenticated user (magic-link) sees every row.
-- NOTE: tightening this to a specific email/claim is a Stage 4 concern.
CREATE POLICY "repos_admin_read_all"
    ON public.repos
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Admin write: any authenticated user can insert/update/delete.
-- NOTE: same caveat — Stage 4 narrows this to the admin identity.
CREATE POLICY "repos_admin_write"
    ON public.repos
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- service_role bypasses RLS automatically — no policy needed for the
-- daily sync Routine.

COMMIT;
