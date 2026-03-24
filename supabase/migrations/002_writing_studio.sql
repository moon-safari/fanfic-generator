-- Story Bibles: per-story reference context (7 section types)
CREATE TABLE public.story_bibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  section_type text NOT NULL CHECK (section_type IN (
    'characters', 'world', 'synopsis', 'genre', 'style_guide', 'outline', 'notes'
  )),
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(story_id, section_type)
);

CREATE INDEX idx_story_bibles_story_id ON public.story_bibles(story_id);

-- Chapter annotations: continuity warnings, inline
CREATE TABLE public.chapter_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  text_match text NOT NULL,
  annotation_type text NOT NULL DEFAULT 'continuity_warning'
    CHECK (annotation_type IN ('continuity_warning', 'suggestion')),
  message text NOT NULL,
  source_chapter int,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error')),
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chapter_annotations_chapter_id ON public.chapter_annotations(chapter_id);

-- Add Tiptap JSON and summary columns to chapters
ALTER TABLE public.chapters ADD COLUMN content_json jsonb;
ALTER TABLE public.chapters ADD COLUMN summary text;

-- RLS policies for story_bibles
ALTER TABLE public.story_bibles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own story bibles"
  ON public.story_bibles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_bibles.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own story bibles"
  ON public.story_bibles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_bibles.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own story bibles"
  ON public.story_bibles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_bibles.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own story bibles"
  ON public.story_bibles FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_bibles.story_id
    AND stories.user_id = auth.uid()
  ));

-- RLS policies for chapter_annotations
ALTER TABLE public.chapter_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own annotations"
  ON public.chapter_annotations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.stories s ON c.story_id = s.id
    WHERE c.id = chapter_annotations.chapter_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own annotations"
  ON public.chapter_annotations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.stories s ON c.story_id = s.id
    WHERE c.id = chapter_annotations.chapter_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own annotations"
  ON public.chapter_annotations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.stories s ON c.story_id = s.id
    WHERE c.id = chapter_annotations.chapter_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own annotations"
  ON public.chapter_annotations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.stories s ON c.story_id = s.id
    WHERE c.id = chapter_annotations.chapter_id
    AND s.user_id = auth.uid()
  ));
