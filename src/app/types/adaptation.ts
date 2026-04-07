import type { StoryContextSource } from "./memory";

export type AdaptationWorkflowStateSource =
  | "draft"
  | "memory"
  | "plans"
  | "saved_outputs"
  | "official_package";

export type AdaptationOutputType =
  | "short_summary"
  | "newsletter_recap"
  | "screenplay_beat_sheet"
  | "screenplay_scene_pages"
  | "comic_page_beat_sheet"
  | "quest_handoff_sheet"
  | "argument_evidence_brief"
  | "public_teaser"
  | "issue_subject_line"
  | "issue_deck"
  | "issue_section_package"
  | "issue_hook_variants"
  | "issue_cta_variants"
  | "issue_send_checklist";

export type AdaptationChainId =
  | "promo_chain"
  | "summary_to_recap"
  | "summary_to_teaser"
  | "story_to_screen_to_comic"
  | "issue_package";

export interface ChapterAdaptationResult {
  id?: string;
  storyId: string;
  outputType: AdaptationOutputType;
  chainId?: AdaptationChainId | null;
  chainStepIndex?: number | null;
  sourceOutputId?: string | null;
  sourceOutputType?: AdaptationOutputType | null;
  chapterId: string;
  chapterNumber: number;
  content: string;
  contextSource: StoryContextSource;
  generatedAt: string;
  updatedAt: string;
  persisted: boolean;
}

export interface AdaptationChainResult {
  chainId: AdaptationChainId;
  results: ChapterAdaptationResult[];
}
