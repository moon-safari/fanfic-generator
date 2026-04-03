-- Extend adaptation outputs so newsletter issue-package artifacts can be
-- stored alongside recap, teaser, and summary outputs.

ALTER TABLE public.adaptation_outputs
  DROP CONSTRAINT IF EXISTS adaptation_outputs_output_type_check;

ALTER TABLE public.adaptation_outputs
  ADD CONSTRAINT adaptation_outputs_output_type_check
  CHECK (output_type IN (
    'short_summary',
    'newsletter_recap',
    'screenplay_beat_sheet',
    'public_teaser',
    'issue_subject_line',
    'issue_deck',
    'issue_hook_variants',
    'issue_cta_variants'
  ));
