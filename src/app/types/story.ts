export type RelationshipType = "gen" | "mm" | "fm" | "ff" | "multi" | "other";
export type Rating = "general" | "teen" | "mature" | "explicit";
export type ProjectMode = "fiction" | "newsletter";
export type NewsletterCadence =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "irregular";

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

export type StoryModeConfig = Record<string, never> | NewsletterModeConfig;

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

export type StoryFormData = FictionStoryFormData | NewsletterStoryFormData;

export interface GenerateResponse {
  title: string;
  chapter: string;
}

export interface ContinueResponse {
  chapter: string;
}
