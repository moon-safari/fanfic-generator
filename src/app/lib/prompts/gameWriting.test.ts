import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChapter1Prompt,
  buildContinuationPrompt,
} from "./index.ts";
import { buildBibleGenerationPrompt } from "./bible.ts";
import type { Story } from "../../types/story.ts";

const gameWritingForm = {
  projectMode: "game_writing" as const,
  title: "Ashes of Red Hollow",
  tone: ["tense", "political"],
  questEngine: "main_quest" as const,
};

const gameWritingStory: Story = {
  id: "story-1",
  title: "Ashes of Red Hollow",
  projectMode: "game_writing",
  modeConfig: {
    draftingPreference: "hybrid_quest_brief",
    formatStyle: "quest_brief",
    questEngine: "main_quest",
  },
  chapters: [
    {
      id: "quest-1",
      chapterNumber: 1,
      content:
        "QUEST 1\nPremise: The magistrate offers the player a dangerous bargain.",
      summary:
        "The player receives the first main-quest offer and sees the political stakes.",
      wordCount: 12,
    },
  ],
  fandom: "",
  characters: [],
  relationshipType: "gen",
  rating: "teen",
  tone: ["tense", "political"],
  tropes: [],
  createdAt: "",
  updatedAt: "",
  wordCount: 12,
};

test("game writing first-quest prompt requests hybrid quest brief structure", () => {
  const prompt = buildChapter1Prompt(gameWritingForm);

  assert.match(prompt, /^Title: Ashes of Red Hollow/m);
  assert.match(prompt, /Write Quest 1/i);
  assert.match(prompt, /Player Goal:/i);
  assert.match(prompt, /Dialogue Choices:/i);
  assert.doesNotMatch(prompt, /Write Chapter 1/i);
});

test("game writing continuation prompt uses quest language and choice pressure", () => {
  const prompt = buildContinuationPrompt(
    gameWritingStory,
    2,
    "=== MEMORY ===\nThe magistrate wants a public confession.",
    "=== PLANNING GUIDANCE ===\nTARGET QUEST PLAN:\n- Intent: Force the first faction split."
  );

  assert.match(prompt, /QUEST 2 INSTRUCTIONS:/);
  assert.match(prompt, /hybrid quest brief/i);
  assert.match(prompt, /embedded dialogue choices/i);
  assert.doesNotMatch(prompt, /CHAPTER 2 INSTRUCTIONS:/);
});

test("game writing bible generation prompt asks for quest-by-quest planning", () => {
  const prompt = buildBibleGenerationPrompt(
    "QUEST 1\nPremise: The magistrate offers the player a dangerous bargain.",
    {
      storyTitle: "Ashes of Red Hollow",
      fandomContext: "",
      projectMode: "game_writing",
      modeConfig: {
        draftingPreference: "hybrid_quest_brief",
        formatStyle: "quest_brief",
        questEngine: "main_quest",
      },
    }
  );

  assert.match(prompt, /quest-by-quest/i);
  assert.match(prompt, /player objective/i);
  assert.doesNotMatch(prompt, /chapter-by-chapter/i);
});
