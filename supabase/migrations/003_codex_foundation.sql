-- Codex foundation: relational story memory for entries, relationships,
-- chapter-aware progressions, and custom types.

CREATE TABLE public.codex_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  name text NOT NULL,
  entry_type text NOT NULL,
  description text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  aliases text[] NOT NULL DEFAULT '{}',
  image_url text,
  color text,
  custom_fields jsonb NOT NULL DEFAULT '[]',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.codex_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  source_entry_id uuid NOT NULL REFERENCES public.codex_entries(id) ON DELETE CASCADE,
  target_entry_id uuid NOT NULL REFERENCES public.codex_entries(id) ON DELETE CASCADE,
  forward_label text NOT NULL DEFAULT '',
  reverse_label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_entry_id, target_entry_id),
  CHECK (source_entry_id <> target_entry_id)
);

CREATE TABLE public.codex_progressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.codex_entries(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL CHECK (chapter_number > 0),
  field_overrides jsonb NOT NULL DEFAULT '{}',
  description_override text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_id, chapter_number)
);

CREATE TABLE public.codex_custom_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#8b5cf6',
  icon text NOT NULL DEFAULT 'book',
  suggested_fields jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, name)
);

CREATE INDEX idx_codex_entries_story_id
  ON public.codex_entries(story_id);

CREATE INDEX idx_codex_entries_story_type_sort
  ON public.codex_entries(story_id, entry_type, sort_order, created_at);

CREATE INDEX idx_codex_entries_story_name
  ON public.codex_entries(story_id, name);

CREATE INDEX idx_codex_entries_tags
  ON public.codex_entries USING gin(tags);

CREATE INDEX idx_codex_entries_aliases
  ON public.codex_entries USING gin(aliases);

CREATE INDEX idx_codex_relationships_story_id
  ON public.codex_relationships(story_id);

CREATE INDEX idx_codex_progressions_entry_chapter
  ON public.codex_progressions(entry_id, chapter_number);

CREATE INDEX idx_codex_custom_types_story_id
  ON public.codex_custom_types(story_id);

ALTER TABLE public.codex_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_custom_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own codex entries"
  ON public.codex_entries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_entries.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own codex entries"
  ON public.codex_entries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_entries.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own codex entries"
  ON public.codex_entries FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_entries.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own codex entries"
  ON public.codex_entries FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_entries.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own codex relationships"
  ON public.codex_relationships FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_relationships.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own codex relationships"
  ON public.codex_relationships FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_relationships.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own codex relationships"
  ON public.codex_relationships FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_relationships.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own codex progressions"
  ON public.codex_progressions FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.codex_entries ce
    JOIN public.stories s ON s.id = ce.story_id
    WHERE ce.id = codex_progressions.entry_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own codex progressions"
  ON public.codex_progressions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.codex_entries ce
    JOIN public.stories s ON s.id = ce.story_id
    WHERE ce.id = codex_progressions.entry_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own codex progressions"
  ON public.codex_progressions FOR UPDATE
  USING (EXISTS (
    SELECT 1
    FROM public.codex_entries ce
    JOIN public.stories s ON s.id = ce.story_id
    WHERE ce.id = codex_progressions.entry_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own codex progressions"
  ON public.codex_progressions FOR DELETE
  USING (EXISTS (
    SELECT 1
    FROM public.codex_entries ce
    JOIN public.stories s ON s.id = ce.story_id
    WHERE ce.id = codex_progressions.entry_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own codex custom types"
  ON public.codex_custom_types FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_custom_types.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own codex custom types"
  ON public.codex_custom_types FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_custom_types.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own codex custom types"
  ON public.codex_custom_types FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_custom_types.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own codex custom types"
  ON public.codex_custom_types FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = codex_custom_types.story_id
    AND stories.user_id = auth.uid()
  ));
