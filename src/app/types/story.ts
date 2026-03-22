export type RelationshipType = "gen" | "mm" | "fm" | "ff" | "multi" | "other";
export type Rating = "general" | "teen" | "mature" | "explicit";

export interface Story {
  id: string;
  title: string;
  chapters: string[];
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
