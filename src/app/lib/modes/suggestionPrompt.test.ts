import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFictionSuggestionPrompt,
} from "./fiction.ts";
import {
  buildNewsletterSuggestionPrompt,
} from "./newsletter.ts";

const planningContext = `=== PLANNING GUIDANCE ===
TARGET CHAPTER PLAN:
- Intent: Force the confrontation to reveal Mara's bargain.
THREADS DUE BY CHAPTER 4:
- Star-Key custody [open]`;

test("fiction suggestion prompts include planning context and draft-only guardrails", () => {
  const prompt = buildFictionSuggestionPrompt(
    "Mara admits the bargain and hands over the key.",
    [
      {
        name: "Mara",
        entryType: "character",
        description: "The reluctant keeper of the Star-Key.",
      },
    ],
    4,
    planningContext
  );

  assert.match(prompt, /=== PLANNING GUIDANCE ===/);
  assert.match(
    prompt,
    /only suggest memory updates for facts, relationships, aliases, or state changes that are actually established in the chapter text/i
  );
  assert.match(
    prompt,
    /do not suggest a memory change solely because it was planned/i
  );
});

test("newsletter suggestion prompts include planning context and draft-only guardrails", () => {
  const prompt = buildNewsletterSuggestionPrompt(
    "This issue finally lands the publication profile thread with a concrete CTA.",
    [
      {
        name: "Publication profile",
        entryType: "topic",
        description: "The central operating concept for the newsletter.",
      },
    ],
    4,
    planningContext
  );

  assert.match(prompt, /=== PLANNING GUIDANCE ===/);
  assert.match(
    prompt,
    /only suggest memory updates for topics, sources, relationships, aliases, or state changes that are actually established in the issue text/i
  );
  assert.match(
    prompt,
    /do not suggest a memory change solely because it was planned/i
  );
});
