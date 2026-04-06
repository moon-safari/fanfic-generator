import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPlanningArtifactContent,
  getArtifactSubtypeLabel,
  getPlanningArtifactConfig,
} from "./artifacts.ts";

test("newsletter planning artifacts use newsletter-aware labels and descriptions", () => {
  const config = getPlanningArtifactConfig("newsletter");

  assert.equal(config.outline.description, "Issue-by-issue plan and status map.");
  assert.equal(config.notes.title, "Editorial Notes");
  assert.equal(getArtifactSubtypeLabel("notes", "newsletter"), "Editorial Notes");
});

test("newsletter planning artifacts format notes with editorial labels", () => {
  const text = formatPlanningArtifactContent(
    "notes",
    {
      text: "Keep the audience promise specific.",
      arcs: [
        {
          id: "trust-loop",
          title: "Trust-building series",
          intent: "Deepen the weekly point of view.",
          status: "active",
        },
      ],
      threads: [
        {
          id: "cta-followup",
          title: "CTA follow-up",
          targetUnit: 5,
          status: "open",
        },
      ],
    },
    undefined,
    "newsletter"
  );

  assert.match(text, /Editorial throughlines:/);
  assert.match(text, /Open promises:/);
  assert.match(text, /Target payoff: Issue 5/);
});
