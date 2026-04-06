ALTER TABLE public.adaptation_outputs
  DROP CONSTRAINT IF EXISTS adaptation_outputs_output_type_check;

ALTER TABLE public.adaptation_outputs
  ADD CONSTRAINT adaptation_outputs_output_type_check
  CHECK (output_type IN (
    'short_summary',
    'newsletter_recap',
    'screenplay_beat_sheet',
    'screenplay_scene_pages',
    'comic_page_beat_sheet',
    'public_teaser',
    'issue_subject_line',
    'issue_deck',
    'issue_section_package',
    'issue_hook_variants',
    'issue_cta_variants',
    'issue_send_checklist'
  ));
