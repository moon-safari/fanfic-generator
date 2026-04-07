import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPlanningArtifactContent,
  getArtifactSubtypeLabel,
  getPlanningArtifactConfig,
  toAdaptationArtifact,
} from "./artifacts.ts";
import { formatAdaptationArtifactLineage } from "./artifactsHelpers.ts";

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

test("adaptation artifacts preserve cross-mode lineage metadata", () => {
  const artifact = toAdaptationArtifact(
    {
      id: "output-2",
      storyId: "story-1",
      chapterId: "chapter-7",
      chapterNumber: 7,
      outputType: "comic_page_beat_sheet",
      content: "1. Open on the broken archive ceiling.",
      contextSource: "story_bible",
      generatedAt: "2026-04-07T10:00:00.000Z",
      updatedAt: "2026-04-07T10:05:00.000Z",
      persisted: true,
      chainId: "story_to_screen_to_comic",
      chainStepIndex: 1,
      sourceOutputId: "output-1",
      sourceOutputType: "screenplay_scene_pages",
    },
    "fiction"
  );

  assert.equal(artifact.derivedMode, "comics");
  assert.equal(artifact.chainId, "story_to_screen_to_comic");
  assert.equal(artifact.sourceOutputType, "screenplay_scene_pages");
  assert.equal(
    formatAdaptationArtifactLineage(artifact),
    "Generated via Story -> Screen -> Comic | Derived from Screenplay Scene Pages"
  );
});
