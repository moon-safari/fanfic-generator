import type {
  NonFictionModeConfig,
  NonFictionPieceEngine,
} from "../types/story";

export const NON_FICTION_PIECE_ENGINES: NonFictionPieceEngine[] = [
  "article",
  "essay",
];

export const DEFAULT_NON_FICTION_MODE_CONFIG: NonFictionModeConfig = {
  draftingPreference: "hybrid_section_draft",
  formatStyle: "article_draft",
  pieceEngine: "article",
};

export function labelNonFictionPieceEngine(value: NonFictionPieceEngine) {
  switch (value) {
    case "essay":
      return "Essay";
    default:
      return "Article";
  }
}
