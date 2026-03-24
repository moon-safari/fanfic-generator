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
  status: "planned" | "written" | "revised";
}

export interface BibleOutlineContent {
  chapters: BibleOutlineChapter[];
}

export interface BibleNotesContent {
  text: string;
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

export interface ChapterAnnotation {
  id: string;
  chapterId: string;
  textMatch: string;
  annotationType: string;
  message: string;
  sourceChapter: string;
  severity: string;
  dismissed: boolean;
  createdAt: string;
  updatedAt: string;
}
