export type RelationshipType = "gen" | "mm" | "fm" | "ff" | "multi" | "other";
export type Rating = "general" | "teen" | "mature" | "explicit";

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

export interface StoryFormData {
  fandom: string;
  customFandom?: string;
  characters: string[];
  relationshipType: RelationshipType;
  rating: Rating;
  setting?: string;
  tone: string[];
  tropes: string[];
}

export interface GenerateResponse {
  title: string;
  chapter: string;
}

export interface ContinueResponse {
  chapter: string;
}
