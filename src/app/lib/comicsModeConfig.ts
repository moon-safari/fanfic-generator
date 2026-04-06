import type { ComicsModeConfig, ComicsSeriesEngine } from "../types/story";

export const COMICS_SERIES_ENGINES: ComicsSeriesEngine[] = [
  "issue",
  "one_shot",
  "graphic_novel",
];

export const DEFAULT_COMICS_MODE_CONFIG: ComicsModeConfig = {
  draftingPreference: "comic_script_pages",
  formatStyle: "comic_script",
  seriesEngine: "issue",
};

export function labelComicsSeriesEngine(value: ComicsSeriesEngine) {
  switch (value) {
    case "graphic_novel":
      return "Graphic novel";
    case "one_shot":
      return "One-shot";
    default:
      return "Issue";
  }
}
