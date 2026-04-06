ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_project_mode_check;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_project_mode_check
  CHECK (project_mode IN ('fiction', 'newsletter', 'screenplay', 'comics'));
