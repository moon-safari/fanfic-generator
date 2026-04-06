import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChapter1Prompt,
  buildContinuationPrompt,
} from "./index.ts";
import { buildBibleGenerationPrompt } from "./bible.ts";
import type { Story } from "../../types/story.ts";

const screenplayForm = {
  projectMode: "screenplay" as const,
  title: "Glass Hour",
  draftingPreference: "script_pages" as const,
  tone: ["tense", "visual"],
  storyEngine: "pilot" as const,
};

const screenplayStory: Story = {
  id: "story-1",
  title: "Glass Hour",
  projectMode: "screenplay",
  modeConfig: {
    draftingPreference: "beat_draft",
    formatStyle: "fountain",
    storyEngine: "pilot",
  },
  chapters: [
    {
      id: "scene-1",
      chapterNumber: 1,
      content: "INT. SUBWAY PLATFORM - NIGHT\nMara waits as the train screams in.",
      summary: "Mara waits for the handoff.",
      wordCount: 13,
    },
  ],
  fandom: "",
  characters: [],
  relationshipType: "gen",
  rating: "teen",
  tone: ["tense", "visual"],
  tropes: [],
  createdAt: "",
  updatedAt: "",
  wordCount: 13,
};

test("screenplay scene-one prompt uses fountain instructions for script pages", () => {
  const prompt = buildChapter1Prompt(screenplayForm);

  assert.match(prompt, /^Title: Glass Hour/m);
  assert.match(prompt, /Write Scene 1/i);
  assert.match(prompt, /Fountain-compatible/i);
  assert.doesNotMatch(prompt, /Write Chapter 1/i);
});

test("screenplay continuation prompt uses scene language and beat-draft guidance", () => {
  const prompt = buildContinuationPrompt(
    screenplayStory,
    2,
    "=== MEMORY ===\nMara carries the briefcase.",
    "=== PLANNING GUIDANCE ===\nTARGET SCENE PLAN:\n- Intent: Force the handoff into the open."
  );

  assert.match(prompt, /SCENE 2 INSTRUCTIONS:/);
  assert.match(prompt, /scene-beat draft/i);
  assert.doesNotMatch(prompt, /CHAPTER 2 INSTRUCTIONS:/);
});

test("screenplay bible generation prompt asks for scene planning rather than chapters", () => {
  const prompt = buildBibleGenerationPrompt("INT. SUBWAY PLATFORM - NIGHT", {
    storyTitle: "Glass Hour",
    fandomContext: "",
    projectMode: "screenplay",
    modeConfig: {
      draftingPreference: "script_pages",
      formatStyle: "fountain",
      storyEngine: "pilot",
    },
  });

  assert.match(prompt, /serialized screenplay/i);
  assert.match(prompt, /Scene 1/i);
  assert.match(prompt, /scene-by-scene/i);
  assert.doesNotMatch(prompt, /Issue 1/i);
});
