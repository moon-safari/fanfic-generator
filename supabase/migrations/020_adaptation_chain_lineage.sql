ALTER TABLE public.adaptation_outputs
  ADD COLUMN IF NOT EXISTS chain_id text NULL;

ALTER TABLE public.adaptation_outputs
  ADD COLUMN IF NOT EXISTS chain_step_index integer NULL;

ALTER TABLE public.adaptation_outputs
  ADD COLUMN IF NOT EXISTS source_output_id uuid NULL;

ALTER TABLE public.adaptation_outputs
  ADD COLUMN IF NOT EXISTS source_output_type text NULL;

ALTER TABLE public.adaptation_outputs
  DROP CONSTRAINT IF EXISTS adaptation_outputs_chain_id_check;

ALTER TABLE public.adaptation_outputs
  ADD CONSTRAINT adaptation_outputs_chain_id_check
  CHECK (chain_id IS NULL OR chain_id IN (
    'promo_chain',
    'summary_to_recap',
    'summary_to_teaser',
    'story_to_screen_to_comic',
    'issue_package'
  ));

ALTER TABLE public.adaptation_outputs
  DROP CONSTRAINT IF EXISTS adaptation_outputs_chain_step_index_check;

ALTER TABLE public.adaptation_outputs
  ADD CONSTRAINT adaptation_outputs_chain_step_index_check
  CHECK (chain_step_index IS NULL OR chain_step_index >= 0);

ALTER TABLE public.adaptation_outputs
  DROP CONSTRAINT IF EXISTS adaptation_outputs_chain_lineage_pair_check;

ALTER TABLE public.adaptation_outputs
  ADD CONSTRAINT adaptation_outputs_chain_lineage_pair_check
  CHECK (
    (chain_id IS NULL AND chain_step_index IS NULL)
    OR (chain_id IS NOT NULL AND chain_step_index IS NOT NULL)
  );

ALTER TABLE public.adaptation_outputs
  DROP CONSTRAINT IF EXISTS adaptation_outputs_source_output_id_fkey;

ALTER TABLE public.adaptation_outputs
  ADD CONSTRAINT adaptation_outputs_source_output_id_fkey
  FOREIGN KEY (source_output_id)
  REFERENCES public.adaptation_outputs(id)
  ON DELETE SET NULL;

ALTER TABLE public.adaptation_outputs
  DROP CONSTRAINT IF EXISTS adaptation_outputs_source_output_type_check;

ALTER TABLE public.adaptation_outputs
  ADD CONSTRAINT adaptation_outputs_source_output_type_check
  CHECK (source_output_type IN (
    'short_summary',
    'newsletter_recap',
    'screenplay_beat_sheet',
    'screenplay_scene_pages',
    'comic_page_beat_sheet',
    'quest_handoff_sheet',
    'argument_evidence_brief',
    'public_teaser',
    'issue_subject_line',
    'issue_deck',
    'issue_section_package',
    'issue_hook_variants',
    'issue_cta_variants',
    'issue_send_checklist'
  ));

ALTER TABLE public.adaptation_outputs
  DROP CONSTRAINT IF EXISTS adaptation_outputs_source_lineage_link_check;

ALTER TABLE public.adaptation_outputs
  ADD CONSTRAINT adaptation_outputs_source_lineage_link_check
  CHECK (source_output_id IS NULL OR source_output_type IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_adaptation_outputs_chain_id
  ON public.adaptation_outputs(chain_id);

CREATE INDEX IF NOT EXISTS idx_adaptation_outputs_source_output_id
  ON public.adaptation_outputs(source_output_id);
