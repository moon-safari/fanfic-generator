export type BibleSectionType =
  | "characters"
  | "world"
  | "synopsis"
  | "genre"
  | "style_guide"
  | "outline"
  | "notes";

export interface BibleCharacter {
  name: string;
  role: string;
  personality: string;
  appearance: string;
  relationships: { character: string; type: string }[];
  voiceNotes: string;
}

export interface BibleCharactersContent {
  characters: BibleCharacter[];
}

export interface BibleWorldContent {
  setting: string;
  rules: string[];
  locations: string[];
  era: string;
  customs: string;
}

export interface BibleSynopsisContent {
  text: string;
}

export interface BibleGenreContent {
  primary: string;
  secondary: string[];
  warnings: string[];
}

export interface BibleStyleGuideContent {
  pov: string;
  tense: string;
  proseStyle: string;
  dialogueStyle: string;
  pacing: string;
}

export interface BibleOutlineChapter {
  number: number;
  title: string;
  summary: string;
  intent?: string;
  keyReveal?: string;
  openLoops?: string[];
  status: "planned" | "written" | "revised";
}

export interface BibleOutlineContent {
  chapters: BibleOutlineChapter[];
}

export interface BiblePlanningArc {
  id: string;
  title: string;
  intent: string;
  status: "planned" | "active" | "landed";
  horizon?: string;
  notes?: string;
}

export interface BiblePlanningThread {
  id: string;
  title: string;
  owner?: string;
  introducedIn?: number;
  targetUnit?: number;
  status: "open" | "building" | "resolved";
  notes?: string;
}

export interface BibleNotesContent {
  text: string;
  arcs?: BiblePlanningArc[];
  threads?: BiblePlanningThread[];
}

export type BibleSectionContent =
  | BibleCharactersContent
  | BibleWorldContent
  | BibleSynopsisContent
  | BibleGenreContent
  | BibleStyleGuideContent
  | BibleOutlineContent
  | BibleNotesContent;

export interface BibleSection {
  id: string;
  storyId: string;
  sectionType: BibleSectionType;
  content: BibleSectionContent;
  createdAt: string;
  updatedAt: string;
}

export interface StoryBible {
  storyId: string;
  sections: Record<BibleSectionType, BibleSection | null>;
}

export type ChapterAnnotationType =
  | "continuity_warning"
  | "planning_drift"
  | "suggestion";

export type ChapterAnnotationReasonType =
  | "fact_contradiction"
  | "intent_miss"
  | "reveal_drift"
  | "due_thread"
  | "arc_drift"
  | "promise_drift"
  | "voice_drift"
  | "hook_drift"
  | "cta_drift"
  | "segment_drift";

export type ChapterAnnotationSuggestedAction =
  | "review_outline"
  | "review_notes"
  | "review_synopsis"
  | "review_style_guide"
  | "dismiss_if_intentional";

export type ChapterAnnotationAction =
  | "mark_thread_resolved"
  | "align_outline_to_draft"
  | "mark_arc_active"
  | "mark_intentional_divergence";

export type ChapterAnnotationResolutionState =
  | "open"
  | "applied"
  | "intentional_divergence";

export interface ChapterAnnotationMetadata {
  reasonType?: ChapterAnnotationReasonType;
  targetSection?: Extract<
    BibleSectionType,
    "synopsis" | "style_guide" | "outline" | "notes"
  >;
  targetLabel?: string;
  reasonDetail?: string;
  targetState?: string;
  targetHorizon?: string;
  targetUnit?: number;
  suggestedAction?: ChapterAnnotationSuggestedAction;
  resolutionState?: ChapterAnnotationResolutionState;
}

export interface ChapterAnnotation {
  id: string;
  chapterId: string;
  textMatch: string;
  annotationType: ChapterAnnotationType;
  message: string;
  sourceChapter: string;
  severity: string;
  metadata?: ChapterAnnotationMetadata;
  dismissed: boolean;
  createdAt: string;
  updatedAt: string;
}
