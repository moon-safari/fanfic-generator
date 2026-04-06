import assert from "node:assert/strict";
import test from "node:test";
import {
  COMICS_SERIES_ENGINES,
  DEFAULT_COMICS_MODE_CONFIG,
  labelComicsSeriesEngine,
} from "./comicsModeConfig.ts";

test("comics mode config exposes default setup values", () => {
  assert.deepEqual(COMICS_SERIES_ENGINES, [
    "issue",
    "one_shot",
    "graphic_novel",
  ]);
  assert.deepEqual(DEFAULT_COMICS_MODE_CONFIG, {
    draftingPreference: "comic_script_pages",
    formatStyle: "comic_script",
    seriesEngine: "issue",
  });
});

test("labelComicsSeriesEngine formats comics scope labels for UI", () => {
  assert.equal(labelComicsSeriesEngine("issue"), "Issue");
  assert.equal(labelComicsSeriesEngine("one_shot"), "One-shot");
  assert.equal(labelComicsSeriesEngine("graphic_novel"), "Graphic novel");
});
