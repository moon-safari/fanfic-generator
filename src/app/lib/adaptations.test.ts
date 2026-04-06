import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdaptationPresetsForMode,
  getDefaultAdaptationOutputType,
} from "./adaptations.ts";

test("screenplay mode exposes screenplay-only outputs", () => {
  const presets = getAdaptationPresetsForMode("screenplay", {
    draftingPreference: "script_pages",
    formatStyle: "fountain",
  });

  assert.equal(
    presets.some((preset) => preset.type === "screenplay_scene_pages"),
    true
  );
  assert.equal(
    presets.some((preset) => preset.type === "screenplay_beat_sheet"),
    true
  );
});

test("fiction mode no longer exposes screenplay beat-sheet output", () => {
  const presets = getAdaptationPresetsForMode("fiction");

  assert.equal(
    presets.some((preset) => preset.type === "screenplay_beat_sheet"),
    false
  );
});

test("screenplay preference changes the default output emphasis", () => {
  assert.equal(
    getDefaultAdaptationOutputType("screenplay", {
      draftingPreference: "script_pages",
      formatStyle: "fountain",
    }),
    "screenplay_beat_sheet"
  );

  assert.equal(
    getDefaultAdaptationOutputType("screenplay", {
      draftingPreference: "beat_draft",
      formatStyle: "fountain",
    }),
    "screenplay_scene_pages"
  );
});

test("comics mode exposes comic page beat sheet output", () => {
  const presets = getAdaptationPresetsForMode("comics", {
    draftingPreference: "comic_script_pages",
    formatStyle: "comic_script",
    seriesEngine: "issue",
  });

  assert.equal(
    presets.some((preset) => preset.type === "comic_page_beat_sheet"),
    true
  );
});

test("fiction mode does not expose comics-only outputs", () => {
  const presets = getAdaptationPresetsForMode("fiction");

  assert.equal(
    presets.some((preset) => preset.type === "comic_page_beat_sheet"),
    false
  );
});

test("comics mode defaults to the beat-sheet output", () => {
  assert.equal(
    getDefaultAdaptationOutputType("comics", {
      draftingPreference: "comic_script_pages",
      formatStyle: "comic_script",
      seriesEngine: "issue",
    }),
    "comic_page_beat_sheet"
  );
});

test("game writing mode exposes quest handoff output", () => {
  const presets = getAdaptationPresetsForMode("game_writing");

  assert.deepEqual(
    presets.map((preset) => preset.type),
    [
      "quest_handoff_sheet",
      "short_summary",
      "public_teaser",
      "newsletter_recap",
    ]
  );
});

test("fiction mode does not expose quest-only outputs", () => {
  const presets = getAdaptationPresetsForMode("fiction");

  assert.equal(
    presets.some((preset) => preset.type === "quest_handoff_sheet"),
    false
  );
});
