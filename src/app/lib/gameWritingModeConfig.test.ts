import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_GAME_WRITING_MODE_CONFIG,
  GAME_WRITING_QUEST_ENGINES,
  labelGameWritingQuestEngine,
} from "./gameWritingModeConfig.ts";

test("game writing mode config exposes default setup values", () => {
  assert.deepEqual(GAME_WRITING_QUEST_ENGINES, [
    "main_quest",
    "side_quest",
    "questline",
  ]);
  assert.deepEqual(DEFAULT_GAME_WRITING_MODE_CONFIG, {
    draftingPreference: "hybrid_quest_brief",
    formatStyle: "quest_brief",
    questEngine: "main_quest",
  });
});

test("labelGameWritingQuestEngine formats quest engine labels for UI", () => {
  assert.equal(labelGameWritingQuestEngine("main_quest"), "Main quest");
  assert.equal(labelGameWritingQuestEngine("side_quest"), "Side quest");
  assert.equal(labelGameWritingQuestEngine("questline"), "Questline");
});
