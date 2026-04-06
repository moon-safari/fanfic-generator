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

test("non-fiction mode uses section-native planning phrasing", () => {
  const mode = getModeConfig("non_fiction");
  const nonFictionOutline = {
    chapters: [
      {
        number: 3,
        title: "Why the current system overstates certainty",
        summary: "Move from setup into the core argument about overclaiming.",
        intent: "Land the central claim and connect it to the strongest evidence.",
        keyReveal: "The framing problem is structural, not accidental.",
        openLoops: ["Hold the policy counterpoint for Section 4"],
        status: "planned" as const,
      },
    ],
  };
  const nonFictionNotes = {
    text: "Do not overclaim beyond the labor-stat source.",
    arcs: [
      {
        id: "core-argument",
        title: "Structural argument",
        intent: "Show that the trend is durable, not anecdotal.",
        status: "active" as const,
        horizon: "Sections 3-4",
      },
    ],
    threads: [
      {
        id: "proof-gap",
        title: "Labor-stat support",
        owner: "primary evidence",
        targetUnit: 3,
        status: "open" as const,
        notes: "Name the report before escalating the claim.",
      },
      {
        id: "policy-counterpoint",
        title: "Policy counterpoint",
        owner: "editorial framing",
        targetUnit: 4,
        status: "open" as const,
        notes: "Keep this live for the next section.",
      },
    ],
  };

  assert.equal(mode.planningUnitLabel, "section beat");
  assert.equal(mode.planningSchema.notes.title, "Editorial Notes");

  const prompt = buildPlanningPromptContext({
    outline: nonFictionOutline,
    notes: nonFictionNotes,
    unitNumber: 3,
    projectMode: "non_fiction",
  });

  assert.match(prompt, /TARGET SECTION PLAN:/);
  assert.match(prompt, /ARGUMENT PRESSURE TO HONOR:/);
  assert.match(prompt, /EVIDENCE DUE BY SECTION 3:/);
  assert.match(prompt, /OTHER OPEN PROOF GAPS:/);
});
