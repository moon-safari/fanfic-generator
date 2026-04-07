import test from "node:test";
import assert from "node:assert/strict";
import { buildChapterAdaptationPrompt, buildChainedAdaptationPrompt } from "./adaptation.ts";

const baseInput = {
  storyTitle: "Moonlit Archive",
  projectMode: "fiction" as const,
  fandom: "Original work",
  customFandom: undefined,
  characters: ["Mara", "Ivo"],
  tone: ["wistful", "tense"],
  tropes: ["found family"],
  chapterNumber: 7,
  storyContext: "Story context: Mara cannot leave the city.",
  planningContext: "Planning context: keep the reveal focused on Mara's choice.",
};

test("chapter prompts include active workflow and current step", () => {
  const prompt = buildChapterAdaptationPrompt({
    ...baseInput,
    outputType: "short_summary",
    chapterContent: "Chapter text",
    workflowLabel: "Chapter adaptation workflow",
    currentStepLabel: "Chapter adaptation workflow · Step 1/2: Short Summary",
  });

  assert.match(prompt, /ACTIVE WORKFLOW: Chapter adaptation workflow/);
  assert.match(
    prompt,
    /CURRENT STEP: Chapter adaptation workflow · Step 1\/2: Short Summary/
  );
});

test("chained prompts include current step, immediate source, and bridge guidance", () => {
  const prompt = buildChainedAdaptationPrompt({
    ...baseInput,
    outputType: "public_teaser",
    sourceLabel: "Newsletter Recap",
    sourceContent: "Recap text",
    workflowLabel: "Promo chain",
    currentStepLabel: "Promo chain · Step 2/2: Public Teaser",
    immediateSourceLabel: "Newsletter Recap (saved result)",
  });

  assert.match(prompt, /CURRENT STEP: Promo chain · Step 2\/2: Public Teaser/);
  assert.match(prompt, /IMMEDIATE SOURCE: Newsletter Recap \(saved result\)/);
  assert.match(
    prompt,
    /Treat the immediate source as a bridge artifact, not permission to contradict original draft truth/
  );
  assert.match(
    prompt,
    /If the bridge artifact conflicts with the original draft truth/
  );
});
