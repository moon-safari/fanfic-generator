import type { AdaptationOutputType } from "./adaptation";
import type {
  BibleNotesContent,
  BibleOutlineContent,
  BibleSectionType,
  BibleStyleGuideContent,
  BibleSynopsisContent,
} from "./bible";
import type { StoryContextSource } from "./codex";

export type PlanningArtifactSubtype = Extract<
  BibleSectionType,
  "synopsis" | "style_guide" | "outline" | "notes"
>;

export type PlanningArtifactContent =
  | BibleSynopsisContent
  | BibleStyleGuideContent
  | BibleOutlineContent
  | BibleNotesContent;

export type ProjectArtifactKind = "adaptation" | "planning";
export type ProjectArtifactSubtype =
  | AdaptationOutputType
  | PlanningArtifactSubtype;

interface BaseProjectArtifact {
  id: string;
  kind: ProjectArtifactKind;
  storyId: string;
  subtype: ProjectArtifactSubtype;
  title: string;
  description: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  persisted: boolean;
}

export interface AdaptationArtifact extends BaseProjectArtifact {
  kind: "adaptation";
  subtype: AdaptationOutputType;
  chapterId: string;
  chapterNumber: number;
  contextSource: StoryContextSource;
}

export interface PlanningArtifact extends BaseProjectArtifact {
  kind: "planning";
  subtype: PlanningArtifactSubtype;
  sectionType: PlanningArtifactSubtype;
  rawContent: PlanningArtifactContent;
  contextSource: "story_bible";
}

export type ProjectArtifact = AdaptationArtifact | PlanningArtifact;
