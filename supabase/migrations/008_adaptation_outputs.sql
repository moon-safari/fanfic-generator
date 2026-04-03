-- Persisted chapter adaptation outputs so transformed writing stays attached
-- to the project instead of disappearing with client state.

CREATE TABLE public.adaptation_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL CHECK (chapter_number > 0),
  output_type text NOT NULL CHECK (output_type IN (
    'short_summary',
    'newsletter_recap',
    'screenplay_beat_sheet',
    'public_teaser'
  )),
  content text NOT NULL DEFAULT '',
  context_source text NOT NULL DEFAULT 'none' CHECK (context_source IN (
    'codex',
    'story_bible',
    'none'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, chapter_id, output_type)
);

CREATE INDEX idx_adaptation_outputs_story_id
  ON public.adaptation_outputs(story_id);

CREATE INDEX idx_adaptation_outputs_chapter_id
  ON public.adaptation_outputs(chapter_id);

CREATE INDEX idx_adaptation_outputs_output_type
  ON public.adaptation_outputs(output_type);

ALTER TABLE public.adaptation_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own adaptation outputs"
  ON public.adaptation_outputs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = adaptation_outputs.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own adaptation outputs"
  ON public.adaptation_outputs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = adaptation_outputs.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own adaptation outputs"
  ON public.adaptation_outputs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = adaptation_outputs.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own adaptation outputs"
  ON public.adaptation_outputs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = adaptation_outputs.story_id
    AND stories.user_id = auth.uid()
  ));

