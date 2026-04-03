-- Structured annotation metadata for actionable continuity and planning drift
-- follow-ups inside the editor and artifact workflow.

ALTER TABLE public.chapter_annotations
  ADD COLUMN IF NOT EXISTS annotation_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
