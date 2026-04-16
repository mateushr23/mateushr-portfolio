-- =====================================================================
-- Migration: add_source_hash
-- Purpose:   Add a nullable `source_hash` column to public.repos that
--            captures a fingerprint of the GitHub-side signal used to
--            generate the AI description. The daily sync regenerates
--            the Claude description only when this hash differs from
--            the stored value (or is NULL, meaning the row predates
--            this migration).
-- =====================================================================

ALTER TABLE public.repos ADD COLUMN source_hash TEXT;

COMMENT ON COLUMN public.repos.source_hash IS 'sha256 of name|gh_description|topics_csv|language — triggers Claude re-description on change.';
