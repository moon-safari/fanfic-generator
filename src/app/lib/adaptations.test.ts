import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdaptationChainPresetsForMode,
  getAdaptationDerivedMode,
  getAdaptationPresetsForMode,
  getDefaultAdaptationOutputType,
  getSelectableAdaptationOutputTypes,
} from "./adaptations.ts";

test("fiction mode exposes story_to_screen_to_comic first in chain ordering", () => {
  const chains = getAdaptationChainPresetsForMode("fiction");

  assert.equal(chains[0]?.id, "story_to_screen_to_comic");
  assert.equal(
    chains.some((chain) => chain.id === "story_to_screen_to_comic"),
    true
  );
});

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

test("derived modes are reported for cross-mode outputs", () => {
  assert.equal(
    getAdaptationDerivedMode("screenplay_scene_pages"),
    "screenplay"
  );
  assert.equal(getAdaptationDerivedMode("comic_page_beat_sheet"), "comics");
  assert.equal(getAdaptationDerivedMode("short_summary"), null);
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

test("non-fiction mode exposes argument evidence brief first", () => {
  const presets = getAdaptationPresetsForMode("non_fiction", {
    draftingPreference: "hybrid_section_draft",
    formatStyle: "article_draft",
    pieceEngine: "article",
  });

  assert.deepEqual(
    presets.map((preset) => preset.type),
    [
      "argument_evidence_brief",
      "short_summary",
      "public_teaser",
      "newsletter_recap",
    ]
  );
});

test("non-fiction mode defaults to the evidence brief output", () => {
  assert.equal(
    getDefaultAdaptationOutputType("non_fiction", {
      draftingPreference: "hybrid_section_draft",
      formatStyle: "article_draft",
      pieceEngine: "essay",
    }),
    "argument_evidence_brief"
  );
});

test("fiction mode does not expose non-fiction-only outputs", () => {
  const presets = getAdaptationPresetsForMode("fiction");

  assert.equal(
    presets.some((preset) => preset.type === "argument_evidence_brief"),
    false
  );
});

test("selectable adaptation outputs include current mode and active chain outputs", () => {
  const selectable = getSelectableAdaptationOutputTypes({
    projectMode: "fiction",
    selectedChainId: "story_to_screen_to_comic",
    savedOutputTypes: ["screenplay_scene_pages", "comic_page_beat_sheet"],
  });

  assert.deepEqual(selectable, [
    "short_summary",
    "newsletter_recap",
    "public_teaser",
    "screenplay_scene_pages",
    "comic_page_beat_sheet",
  ]);
});

test("saved cross-mode derivatives remain selectable on fiction projects", () => {
  const selectable = getSelectableAdaptationOutputTypes({
    projectMode: "fiction",
    selectedChainId: "promo_chain",
    savedOutputTypes: ["screenplay_scene_pages", "comic_page_beat_sheet"],
  });

  assert.deepEqual(selectable, [
    "short_summary",
    "newsletter_recap",
    "public_teaser",
    "screenplay_scene_pages",
    "comic_page_beat_sheet",
  ]);
});
