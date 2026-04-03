-- Craft history table for persisted craft tool results per story/chapter.

CREATE TABLE public.craft_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL,
  tool_type text NOT NULL CHECK (tool_type IN ('rewrite', 'expand', 'describe', 'brainstorm')),
  direction text,
  selected_text text NOT NULL,
  result jsonb NOT NULL,
  status text NOT NULL DEFAULT 'generated'
    CHECK (status IN ('generated', 'inserted', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_craft_history_story_chapter
  ON public.craft_history(story_id, chapter_number);

ALTER TABLE public.craft_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own craft history"
  ON public.craft_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own craft history"
  ON public.craft_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own craft history"
  ON public.craft_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own craft history"
  ON public.craft_history FOR DELETE
  USING (auth.uid() = user_id);
