-- Deterministic manuscript mentions for Codex entries, scoped per chapter.

CREATE TABLE public.codex_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL CHECK (chapter_number > 0),
  entry_id uuid NOT NULL REFERENCES public.codex_entries(id) ON DELETE CASCADE,
  matched_text text NOT NULL,
  matched_alias text,
  start_index integer NOT NULL CHECK (start_index >= 0),
  end_index integer NOT NULL CHECK (end_index > start_index),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_codex_mentions_unique_range
  ON public.codex_mentions(chapter_id, entry_id, start_index, end_index);

CREATE INDEX idx_codex_mentions_story_id
  ON public.codex_mentions(story_id);

CREATE INDEX idx_codex_mentions_chapter_id
  ON public.codex_mentions(chapter_id);

CREATE INDEX idx_codex_mentions_entry_id
  ON public.codex_mentions(entry_id);

CREATE INDEX idx_codex_mentions_chapter_number
  ON public.codex_mentions(chapter_number);

ALTER TABLE public.codex_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own codex mentions"
  ON public.codex_mentions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_mentions.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own codex mentions"
  ON public.codex_mentions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_mentions.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own codex mentions"
  ON public.codex_mentions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_mentions.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own codex mentions"
  ON public.codex_mentions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_mentions.story_id
    AND stories.user_id = auth.uid()
  )));
