export interface Story {
  id: string;
  title: string;
  chapters: string[];
  fandom: string;
  customFandom?: string;
  characters: string;
  setting: string;
  plotTheme: string;
  tone: string;
  tropes: string[];
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

export interface StoryFormData {
  fandom: string;
  customFandom?: string;
  characters: string;
  setting: string;
  plotTheme: string;
  tone: string;
  tropes: string[];
}

export interface GenerateResponse {
  title: string;
  chapter: string;
}

export interface ContinueResponse {
  chapter: string;
}
