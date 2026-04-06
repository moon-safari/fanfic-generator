ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_project_mode_check;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_project_mode_check
  CHECK (project_mode IN (
    'fiction',
    'newsletter',
    'screenplay',
    'comics',
    'game_writing'
  ));

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
    'quest_handoff_sheet',
    'public_teaser',
    'issue_subject_line',
    'issue_deck',
    'issue_section_package',
    'issue_hook_variants',
    'issue_cta_variants',
    'issue_send_checklist'
  ));
