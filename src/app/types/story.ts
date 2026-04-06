export type RelationshipType = "gen" | "mm" | "fm" | "ff" | "multi" | "other";
export type Rating = "general" | "teen" | "mature" | "explicit";
export type ProjectMode = "fiction" | "newsletter" | "screenplay" | "comics";
export type NewsletterCadence =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "irregular";
export type ScreenplayDraftingPreference = "script_pages" | "beat_draft";
export type ScreenplayStoryEngine = "feature" | "pilot" | "short";
export type ComicsDraftingPreference = "comic_script_pages";
export type ComicsSeriesEngine = "issue" | "one_shot" | "graphic_novel";

export interface NewsletterModeConfig {
  topic: string;
  audience: string;
  issueAngle: string;
  cadence: NewsletterCadence;
  subtitle?: string;
  hookApproach?: string;
  ctaStyle?: string;
  recurringSections?: string[];
}

export interface ScreenplayModeConfig {
  draftingPreference: ScreenplayDraftingPreference;
  formatStyle: "fountain";
  storyEngine?: ScreenplayStoryEngine;
}

export interface ComicsModeConfig {
  draftingPreference: ComicsDraftingPreference;
  formatStyle: "comic_script";
  seriesEngine?: ComicsSeriesEngine;
}

export type StoryModeConfig =
  | Record<string, never>
  | NewsletterModeConfig
  | ScreenplayModeConfig
  | ComicsModeConfig;

export interface Chapter {
  id: string;
  chapterNumber: number;
  content: string;           // plain text (always present)
  contentJson?: object;      // Tiptap document JSON
  summary?: string;          // Haiku-generated 2-sentence summary
  wordCount: number;
}

export interface Story {
  id: string;
  title: string;
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
  chapters: Chapter[];
  fandom: string;
  customFandom?: string;
  characters: string[];
  relationshipType: RelationshipType;
  rating: Rating;
  setting?: string;
  tone: string[];
  tropes: string[];
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

export interface FictionStoryFormData {
  projectMode: "fiction";
  fandom: string;
  customFandom?: string;
  characters: string[];
  relationshipType: RelationshipType;
  rating: Rating;
  setting?: string;
  tone: string[];
  tropes: string[];
}

export interface NewsletterStoryFormData {
  projectMode: "newsletter";
  title: string;
  newsletterTopic: string;
  audience: string;
  issueAngle: string;
  cadence: NewsletterCadence;
  tone: string[];
}

export interface ScreenplayStoryFormData {
  projectMode: "screenplay";
  title: string;
  draftingPreference: ScreenplayDraftingPreference;
  tone: string[];
  storyEngine?: ScreenplayStoryEngine;
}

export interface ComicsStoryFormData {
  projectMode: "comics";
  title: string;
  tone: string[];
  seriesEngine?: ComicsSeriesEngine;
}

export type StoryFormData =
  | FictionStoryFormData
  | NewsletterStoryFormData
  | ScreenplayStoryFormData
  | ComicsStoryFormData;

export interface GenerateResponse {
  title: string;
  chapter: string;
}

export interface ContinueResponse {
  chapter: string;
}
