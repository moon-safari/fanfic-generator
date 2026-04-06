import type {
  GameWritingModeConfig,
  GameWritingQuestEngine,
} from "../types/story";

export const GAME_WRITING_QUEST_ENGINES: GameWritingQuestEngine[] = [
  "main_quest",
  "side_quest",
  "questline",
];

export const DEFAULT_GAME_WRITING_MODE_CONFIG: GameWritingModeConfig = {
  draftingPreference: "hybrid_quest_brief",
  formatStyle: "quest_brief",
  questEngine: "main_quest",
};

export function labelGameWritingQuestEngine(value: GameWritingQuestEngine) {
  switch (value) {
    case "side_quest":
      return "Side quest";
    case "questline":
      return "Questline";
    default:
      return "Main quest";
  }
}
