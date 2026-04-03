-- Project modes let the Writing OS support multiple creative workflows on the
-- same story backbone without duplicating products or relaxing ownership rules.

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS project_mode text NOT NULL DEFAULT 'fiction'
  CHECK (project_mode IN ('fiction', 'newsletter'));

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS mode_config jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_stories_project_mode
  ON public.stories(project_mode);
