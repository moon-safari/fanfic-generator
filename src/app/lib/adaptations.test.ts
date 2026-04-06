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
