-- =====================================================================
-- Migration: bilingual_descriptions
-- Purpose:   Rename legacy `description_ai` column to `description_pt`
--            (semantic clarity after @anthropic-ai/sdk was removed — the
--            content now comes directly from the README, not AI) and
--            add a nullable `description_en` counterpart so the sync
--            pipeline can persist the English version parsed from
--            bilingual READMEs (`## English` section). Existing
--            monolingual READMEs continue to populate only `description_pt`;
--            `description_en` stays NULL until a bilingual README lands
--            in the satellite repo.
-- Safety:    Rename + add are idempotent via explicit column checks.
--            RLS policies on public.repos are policy-level (TO anon /
--            authenticated with is_hidden filter) and do not reference
--            either column name, so this migration does not require
--            touching any policy.
-- =====================================================================

BEGIN;

-- 1. Rename the legacy column. Guarded so a second apply is a no-op.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'repos'
          AND column_name = 'description_ai'
    ) THEN
        ALTER TABLE public.repos RENAME COLUMN description_ai TO description_pt;
    END IF;
END
$$;

-- 2. Add the EN counterpart. Nullable — fallback logic in the frontend
--    handles missing values (shows PT-BR or a short placeholder).
ALTER TABLE public.repos
    ADD COLUMN IF NOT EXISTS description_en TEXT;

-- 3. Refresh column comments to match the new semantics.
COMMENT ON COLUMN public.repos.description_pt IS 'PT-BR description parsed from the README first paragraph (above the ## English section when bilingual). Null when the repo has no README.';
COMMENT ON COLUMN public.repos.description_en IS 'EN description parsed from the ## English section of a bilingual README. Null when the README is monolingual or the section is absent.';

COMMIT;
