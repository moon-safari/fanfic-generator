import assert from "node:assert/strict";
import test from "node:test";
import { buildPlanningPromptContext } from "./planningContext.ts";
import { getModeConfig } from "./modes/registry.ts";

const outline = {
  chapters: [
    {
      number: 4,
      title: "The Terms of the Bargain",
      summary: "Mara finally states the price of the Star-Key.",
      intent: "Force the confrontation into the open.",
      keyReveal: "Mara bargained away her claim to the key.",
      openLoops: ["Who now controls the Star-Key?"],
      status: "planned" as const,
    },
  ],
};

const notes = {
  text: "Keep the promise ledger legible.",
  arcs: [
    {
      id: "price-of-power",
      title: "The price of power",
      intent: "Show every gain costing Mara something real.",
      status: "active" as const,
      horizon: "Before the midpoint",
    },
  ],
  threads: [
    {
      id: "star-key-custody",
      title: "Star-Key custody",
      owner: "Mara",
      targetUnit: 4,
      status: "open" as const,
      notes: "Resolve who physically holds it after the reveal.",
    },
  ],
};

test("fiction mode exposes planning metadata and fiction phrasing", () => {
  const mode = getModeConfig("fiction");

  assert.equal(mode.planningUnitLabel, "beat");
  assert.equal(mode.planningSchema.notes.title, "Planning Notes");

  const prompt = buildPlanningPromptContext({
    outline,
    notes,
    unitNumber: 4,
    projectMode: "fiction",
  });

  assert.match(prompt, /TARGET CHAPTER PLAN:/);
  assert.match(prompt, /ACTIVE ARCS TO HONOR:/);
  assert.match(prompt, /THREADS DUE BY CHAPTER 4:/);
});

test("newsletter mode uses newsletter-native planning phrasing", () => {
  const mode = getModeConfig("newsletter");

  assert.equal(mode.planningUnitLabel, "topic slot");
  assert.equal(mode.planningSchema.notes.title, "Editorial Notes");

  const prompt = buildPlanningPromptContext({
    outline,
    notes,
    unitNumber: 4,
    projectMode: "newsletter",
  });

  assert.match(prompt, /TARGET ISSUE PLAN:/);
  assert.match(prompt, /EDITORIAL THROUGHLINES TO HONOR:/);
  assert.match(prompt, /OPEN PROMISES DUE BY ISSUE 4:/);
});

test("comics mode uses page-native planning phrasing", () => {
  const mode = getModeConfig("comics");

  assert.equal(mode.planningUnitLabel, "page beat");
  assert.equal(mode.planningSchema.notes.title, "Visual Notes");

  const prompt = buildPlanningPromptContext({
    outline,
    notes,
    unitNumber: 4,
    projectMode: "comics",
  });

  assert.match(prompt, /TARGET PAGE PLAN:/);
  assert.match(prompt, /VISUAL AND STORY PRESSURE TO HONOR:/);
  assert.match(prompt, /REVEALS DUE BY PAGE 4:/);
});

test("game writing mode uses quest-native planning phrasing", () => {
  const mode = getModeConfig("game_writing");

  assert.equal(mode.planningUnitLabel, "quest beat");
  assert.equal(mode.planningSchema.notes.title, "Design Notes");

  const prompt = buildPlanningPromptContext({
    outline,
    notes,
    unitNumber: 4,
    projectMode: "game_writing",
  });

  assert.match(prompt, /TARGET QUEST PLAN:/);
  assert.match(prompt, /QUEST PRESSURE TO HONOR:/);
  assert.match(prompt, /OUTCOMES DUE BY QUEST 4:/);
});
