import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChapter1Prompt,
  buildContinuationPrompt,
} from "./index.ts";
import { buildBibleGenerationPrompt } from "./bible.ts";
import type { Story } from "../../types/story.ts";

const comicsForm = {
  projectMode: "comics" as const,
  title: "Ash Canary",
  tone: ["tense", "mythic"],
  seriesEngine: "issue" as const,
};

const comicsStory: Story = {
  id: "story-1",
  title: "Ash Canary",
  projectMode: "comics",
  modeConfig: {
    draftingPreference: "comic_script_pages",
    formatStyle: "comic_script",
    seriesEngine: "issue",
  },
  chapters: [
    {
      id: "page-1",
      chapterNumber: 1,
      content: "PAGE 1\nPanel 1: The city hangs under a storm halo.",
      summary: "The city and heroine are introduced under storm pressure.",
      wordCount: 13,
    },
  ],
  fandom: "",
  characters: [],
  relationshipType: "gen",
  rating: "teen",
  tone: ["tense", "mythic"],
  tropes: [],
  createdAt: "",
  updatedAt: "",
  wordCount: 13,
};

test("comics first-page prompt requests numbered panels and page format", () => {
  const prompt = buildChapter1Prompt(comicsForm);

  assert.match(prompt, /^Title: Ash Canary/m);
  assert.match(prompt, /Write Page 1/i);
  assert.match(prompt, /numbered panels/i);
  assert.doesNotMatch(prompt, /Write Scene 1/i);
});

test("comics continuation prompt uses page language and comic-script guidance", () => {
  const prompt = buildContinuationPrompt(
    comicsStory,
    2,
    "=== MEMORY ===\nThe Ash Canary symbol marks the skyline.",
    "=== PLANNING GUIDANCE ===\nTARGET PAGE PLAN:\n- Intent: End on a page-turn reveal."
  );

  assert.match(prompt, /PAGE 2 INSTRUCTIONS:/);
  assert.match(prompt, /comic script/i);
  assert.match(prompt, /page-turn/i);
  assert.doesNotMatch(prompt, /SCENE 2 INSTRUCTIONS:/);
});

test("comics bible generation prompt asks for page-by-page planning", () => {
  const prompt = buildBibleGenerationPrompt(
    "PAGE 1\nPanel 1: The city hangs under a storm halo.",
    {
      storyTitle: "Ash Canary",
      fandomContext: "",
      projectMode: "comics",
      modeConfig: {
        draftingPreference: "comic_script_pages",
        formatStyle: "comic_script",
        seriesEngine: "issue",
      },
    }
  );

  assert.match(prompt, /page-by-page/i);
  assert.match(prompt, /Page 1/i);
  assert.doesNotMatch(prompt, /Scene 1/i);
});
