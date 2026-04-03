-- Canonical newsletter issue-package state so generated options can become
-- chosen, editable, and clearable project truth per issue.

CREATE TABLE public.newsletter_issue_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL CHECK (chapter_number > 0),
  selected_subject_line text NOT NULL DEFAULT '',
  selected_deck text NOT NULL DEFAULT '',
  selected_hook text NOT NULL DEFAULT '',
  selected_cta text NOT NULL DEFAULT '',
  selected_section_package text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, chapter_id)
);

CREATE INDEX idx_newsletter_issue_packages_story_id
  ON public.newsletter_issue_packages(story_id);

CREATE INDEX idx_newsletter_issue_packages_chapter_id
  ON public.newsletter_issue_packages(chapter_id);

ALTER TABLE public.newsletter_issue_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own newsletter issue packages"
  ON public.newsletter_issue_packages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = newsletter_issue_packages.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own newsletter issue packages"
  ON public.newsletter_issue_packages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = newsletter_issue_packages.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own newsletter issue packages"
  ON public.newsletter_issue_packages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = newsletter_issue_packages.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own newsletter issue packages"
  ON public.newsletter_issue_packages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = newsletter_issue_packages.story_id
    AND stories.user_id = auth.uid()
  ));
