-- =====================================================================
-- Migration: add_stack_column
-- Purpose:   Add a `stack` text[] column to public.repos that captures
--            the tech stack parsed from each repo's README (## Stack
--            section). The sync pipeline populates this directly from
--            GitHub READMEs, replacing the previous Claude-generated
--            description flow (@anthropic-ai/sdk removed in the same
--            change).
-- =====================================================================

ALTER TABLE public.repos
  ADD COLUMN IF NOT EXISTS stack text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.repos.stack IS 'Tech stack tokens parsed from the README ## Stack section (bullet list). Empty array when README has no Stack section.';
