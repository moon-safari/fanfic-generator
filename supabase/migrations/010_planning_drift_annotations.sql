-- Allow continuity review to persist planning-aware drift annotations in
-- addition to generic continuity warnings.

ALTER TABLE public.chapter_annotations
  DROP CONSTRAINT IF EXISTS chapter_annotations_annotation_type_check;

ALTER TABLE public.chapter_annotations
  ADD CONSTRAINT chapter_annotations_annotation_type_check
  CHECK (annotation_type IN (
    'continuity_warning',
    'planning_drift',
    'suggestion'
  ));
