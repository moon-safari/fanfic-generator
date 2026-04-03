-- Codex change suggestions: AI-suggested structured Codex updates that users
-- can review and apply after a chapter changes the story state.

CREATE TABLE public.codex_change_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL CHECK (chapter_number > 0),
  target_entry_id uuid REFERENCES public.codex_entries(id) ON DELETE SET NULL,
  change_type text NOT NULL CHECK (change_type IN (
    'create_entry',
    'update_entry_aliases',
    'create_relationship',
    'create_progression',
    'flag_stale_entry'
  )),
  payload jsonb NOT NULL DEFAULT '{}',
  evidence_text text,
  rationale text,
  confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'applied')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  applied_at timestamptz
);

CREATE INDEX idx_codex_change_suggestions_story_id
  ON public.codex_change_suggestions(story_id);

CREATE INDEX idx_codex_change_suggestions_chapter_id
  ON public.codex_change_suggestions(chapter_id);

CREATE INDEX idx_codex_change_suggestions_status
  ON public.codex_change_suggestions(status);

CREATE INDEX idx_codex_change_suggestions_target_entry_id
  ON public.codex_change_suggestions(target_entry_id);

ALTER TABLE public.codex_change_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own codex change suggestions"
  ON public.codex_change_suggestions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_change_suggestions.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own codex change suggestions"
  ON public.codex_change_suggestions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_change_suggestions.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own codex change suggestions"
  ON public.codex_change_suggestions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_change_suggestions.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own codex change suggestions"
  ON public.codex_change_suggestions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_change_suggestions.story_id
    AND stories.user_id = auth.uid()
  )));
