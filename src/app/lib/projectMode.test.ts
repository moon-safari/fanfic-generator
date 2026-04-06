import assert from "node:assert/strict";
import test from "node:test";
import {
  getContinueActionLabel,
  getLoadingContinueLabel,
  getProjectModeLabel,
  getProjectUnitLabel,
  parseComicsModeConfig,
  parseGameWritingModeConfig,
  parseNonFictionModeConfig,
  parseStoryModeConfig,
  parseScreenplayModeConfig,
} from "./projectMode.ts";
import { getModeConfig } from "./modes/registry.ts";

test("screenplay mode exposes scene labels and screenplay defaults", () => {
  const mode = getModeConfig("screenplay");

  assert.equal(getProjectModeLabel("screenplay"), "Screenplay");
  assert.equal(getProjectUnitLabel("screenplay"), "scene");
  assert.equal(
    getProjectUnitLabel("screenplay", { capitalize: true }),
    "Scene"
  );
  assert.equal(getContinueActionLabel("screenplay"), "Continue Scene");
  assert.equal(
    getLoadingContinueLabel("screenplay"),
    "Writing the next scene..."
  );
  assert.equal(mode.contentUnitSingular, "scene");
  assert.equal(
    mode.planningSchema.outline.description,
    "Scene-by-scene plan and status map."
  );
  assert.deepEqual(mode.coreTypes, [
    "character",
    "location",
    "prop",
    "faction",
    "setpiece",
    "theme",
  ]);
});

test("parseScreenplayModeConfig normalizes valid screenplay config", () => {
  const parsed = parseScreenplayModeConfig({
    draftingPreference: "script_pages",
    formatStyle: "fountain",
    storyEngine: "pilot",
  });

  assert.deepEqual(parsed, {
    draftingPreference: "script_pages",
    formatStyle: "fountain",
    storyEngine: "pilot",
  });
});

test("parseScreenplayModeConfig rejects incomplete screenplay config", () => {
  assert.equal(parseScreenplayModeConfig({ draftingPreference: "script_pages" }), null);
  assert.equal(parseScreenplayModeConfig({ formatStyle: "fountain" }), null);
});

test("parseStoryModeConfig supports screenplay mode", () => {
  assert.deepEqual(
    parseStoryModeConfig("screenplay", {
      draftingPreference: "beat_draft",
      formatStyle: "fountain",
      storyEngine: "feature",
    }),
    {
      draftingPreference: "beat_draft",
      formatStyle: "fountain",
      storyEngine: "feature",
    }
  );
});

test("comics mode exposes page labels and comics defaults", () => {
  const mode = getModeConfig("comics");

  assert.equal(getProjectModeLabel("comics"), "Comics");
  assert.equal(getProjectUnitLabel("comics"), "page");
  assert.equal(getProjectUnitLabel("comics", { capitalize: true }), "Page");
  assert.equal(getContinueActionLabel("comics"), "Continue Page");
  assert.equal(
    getLoadingContinueLabel("comics"),
    "Writing the next page..."
  );
  assert.equal(mode.contentUnitSingular, "page");
  assert.equal(
    mode.planningSchema.outline.description,
    "Page-by-page plan and status map."
  );
  assert.deepEqual(mode.coreTypes, [
    "character",
    "location",
    "visual_motif",
    "panel_layout",
    "narrative_device",
  ]);
});

test("parseComicsModeConfig normalizes valid comics config", () => {
  const parsed = parseComicsModeConfig({
    draftingPreference: "comic_script_pages",
    formatStyle: "comic_script",
    seriesEngine: "issue",
  });

  assert.deepEqual(parsed, {
    draftingPreference: "comic_script_pages",
    formatStyle: "comic_script",
    seriesEngine: "issue",
  });
});

test("parseStoryModeConfig supports comics mode", () => {
  assert.deepEqual(
    parseStoryModeConfig("comics", {
      draftingPreference: "comic_script_pages",
      formatStyle: "comic_script",
      seriesEngine: "graphic_novel",
    }),
    {
      draftingPreference: "comic_script_pages",
      formatStyle: "comic_script",
      seriesEngine: "graphic_novel",
    }
  );
});

test("game writing mode exposes quest labels and systems-aware defaults", () => {
  const mode = getModeConfig("game_writing");

  assert.equal(getProjectModeLabel("game_writing"), "Game Writing");
  assert.equal(getProjectUnitLabel("game_writing"), "quest");
  assert.equal(
    getProjectUnitLabel("game_writing", { capitalize: true }),
    "Quest"
  );
  assert.equal(getContinueActionLabel("game_writing"), "Continue Quest");
  assert.equal(
    getLoadingContinueLabel("game_writing"),
    "Writing the next quest..."
  );
  assert.equal(mode.contentUnitSingular, "quest");
  assert.equal(
    mode.planningSchema.outline.description,
    "Quest-by-quest plan and status map."
  );
  assert.deepEqual(mode.coreTypes, [
    "character",
    "location",
    "quest",
    "item",
    "faction",
    "lore",
    "dialogue_branch",
  ]);
});

test("parseGameWritingModeConfig normalizes valid game-writing config", () => {
  const parsed = parseGameWritingModeConfig({
    draftingPreference: "hybrid_quest_brief",
    formatStyle: "quest_brief",
    questEngine: "questline",
  });

  assert.deepEqual(parsed, {
    draftingPreference: "hybrid_quest_brief",
    formatStyle: "quest_brief",
    questEngine: "questline",
  });
});

test("parseStoryModeConfig supports game writing mode", () => {
  assert.deepEqual(
    parseStoryModeConfig("game_writing", {
      draftingPreference: "hybrid_quest_brief",
      formatStyle: "quest_brief",
      questEngine: "main_quest",
    }),
    {
      draftingPreference: "hybrid_quest_brief",
      formatStyle: "quest_brief",
      questEngine: "main_quest",
    }
  );
});

test("non-fiction mode exposes section labels and evidence-aware defaults", () => {
  const mode = getModeConfig("non_fiction");

  assert.equal(getProjectModeLabel("non_fiction"), "Non-Fiction");
  assert.equal(getProjectUnitLabel("non_fiction"), "section");
  assert.equal(
    getProjectUnitLabel("non_fiction", { capitalize: true }),
    "Section"
  );
  assert.equal(getContinueActionLabel("non_fiction"), "Continue Section");
  assert.equal(
    getLoadingContinueLabel("non_fiction"),
    "Writing the next section..."
  );
  assert.equal(mode.contentUnitSingular, "section");
  assert.equal(
    mode.planningSchema.outline.description,
    "Section-by-section argument structure and status map."
  );
  assert.deepEqual(mode.coreTypes, [
    "source",
    "claim",
    "topic",
    "argument",
    "evidence",
    "counterpoint",
    "quote",
  ]);
});

test("parseNonFictionModeConfig normalizes valid non-fiction config", () => {
  const parsed = parseNonFictionModeConfig({
    draftingPreference: "hybrid_section_draft",
    formatStyle: "article_draft",
    pieceEngine: "essay",
  });

  assert.deepEqual(parsed, {
    draftingPreference: "hybrid_section_draft",
    formatStyle: "article_draft",
    pieceEngine: "essay",
  });
});

test("parseStoryModeConfig supports non-fiction mode", () => {
  assert.deepEqual(
    parseStoryModeConfig("non_fiction", {
      draftingPreference: "hybrid_section_draft",
      formatStyle: "article_draft",
      pieceEngine: "article",
    }),
    {
      draftingPreference: "hybrid_section_draft",
      formatStyle: "article_draft",
      pieceEngine: "article",
    }
  );
});
