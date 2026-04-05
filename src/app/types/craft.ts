export type CraftTool = "rewrite" | "expand" | "describe" | "brainstorm";

export interface SenseDescription {
  type: "sight" | "smell" | "sound" | "touch" | "taste";
  text: string;
}

export interface BrainstormIdea {
  title: string;
  description: string;
  prose: string;
}

export type CraftResult =
  | { type: "rewrite"; text: string }
  | { type: "expand"; text: string }
  | { type: "describe"; blend: string; senses: SenseDescription[] }
  | { type: "brainstorm"; ideas: BrainstormIdea[] };

export type SidePanelTab =
  | "memory"
  | "artifacts"
  | "adapt"
  | "craft"
  | "history";

export type SidePanelWidth = "normal" | "expanded" | "focus";

export interface CraftHistoryEntry {
  id: string;
  storyId: string;
  chapterNumber: number;
  toolType: CraftTool;
  direction: string | null;
  selectedText: string;
  result: CraftResult;
  status: "generated" | "inserted" | "dismissed";
  createdAt: string;
}
