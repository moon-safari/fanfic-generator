import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChapter1Prompt,
  buildContinuationPrompt,
} from "./index.ts";
import { buildBibleGenerationPrompt } from "./bible.ts";
import type { Story } from "../../types/story.ts";

const nonFictionForm = {
  projectMode: "non_fiction" as const,
  title: "The Cost of Pretending Everything Scales",
  tone: ["sharp", "analytical"],
  pieceEngine: "article" as const,
};

const nonFictionStory: Story = {
  id: "story-1",
  title: "The Cost of Pretending Everything Scales",
  projectMode: "non_fiction",
  modeConfig: {
    draftingPreference: "hybrid_section_draft",
    formatStyle: "article_draft",
    pieceEngine: "article",
  },
  chapters: [
    {
      id: "section-1",
      chapterNumber: 1,
      content:
        "SECTION 1\nPurpose: Establish the system problem.\nClaim cue: The market rewards false certainty.\nEvidence cue: Creator interviews and hiring slowdown data.\nDraft: The opening frames the core pressure.",
      summary: "Section 1 frames the thesis and names the first proof burden.",
      wordCount: 31,
    },
  ],
  fandom: "",
  characters: [],
  relationshipType: "gen",
  rating: "teen",
  tone: ["sharp", "analytical"],
  tropes: [],
  createdAt: "",
  updatedAt: "",
  wordCount: 31,
};

test("non-fiction first-section prompt requests hybrid section draft structure", () => {
  const prompt = buildChapter1Prompt(nonFictionForm);

  assert.match(prompt, /^Title: The Cost of Pretending Everything Scales/m);
  assert.match(prompt, /Write Section 1/i);
  assert.match(prompt, /Claim cue:/i);
  assert.match(prompt, /Evidence cue:/i);
  assert.doesNotMatch(prompt, /Write Chapter 1/i);
});

test("non-fiction continuation prompt uses section language and evidence pressure", () => {
  const prompt = buildContinuationPrompt(
    nonFictionStory,
    2,
    "=== MEMORY ===\n- Labor-stat report (source): strongest quantitative support so far.",
    "=== PLANNING GUIDANCE ===\nTARGET SECTION PLAN:\n- Intent: Move from setup into the structural argument."
  );

  assert.match(prompt, /SECTION 2 INSTRUCTIONS:/);
  assert.match(prompt, /hybrid section draft/i);
  assert.match(prompt, /inline claim\/evidence cues/i);
  assert.doesNotMatch(prompt, /CHAPTER 2 INSTRUCTIONS:/);
});

test("non-fiction bible generation prompt asks for section-by-section argument planning", () => {
  const prompt = buildBibleGenerationPrompt(
    "SECTION 1\nPurpose: Establish the system problem.\nClaim cue: The market rewards false certainty.",
    {
      storyTitle: "The Cost of Pretending Everything Scales",
      fandomContext: "",
      projectMode: "non_fiction",
      modeConfig: {
        draftingPreference: "hybrid_section_draft",
        formatStyle: "article_draft",
        pieceEngine: "article",
      },
    }
  );

  assert.match(prompt, /section-by-section/i);
  assert.match(prompt, /source-aware/i);
  assert.doesNotMatch(prompt, /chapter-by-chapter/i);
});
