-- Writer-controlled Codex context steering for pinning or excluding entries
-- from the active story context used by generation and craft tools.

CREATE TABLE public.codex_context_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.codex_entries(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('pin', 'exclude')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, entry_id)
);

CREATE INDEX idx_codex_context_rules_story_id
  ON public.codex_context_rules(story_id);

CREATE INDEX idx_codex_context_rules_entry_id
  ON public.codex_context_rules(entry_id);

CREATE INDEX idx_codex_context_rules_mode
  ON public.codex_context_rules(mode);

ALTER TABLE public.codex_context_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own codex context rules"
  ON public.codex_context_rules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_context_rules.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own codex context rules"
  ON public.codex_context_rules FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_context_rules.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own codex context rules"
  ON public.codex_context_rules FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_context_rules.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own codex context rules"
  ON public.codex_context_rules FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_context_rules.story_id
    AND stories.user_id = auth.uid()
  ));
