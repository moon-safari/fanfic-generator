import assert from "node:assert/strict";
import test from "node:test";
import { buildStoryExportFile } from "./storyExport.ts";
import type { Story } from "../types/story.ts";

test("screenplay script pages export as fountain", () => {
  const story: Story = {
    id: "screenplay-1",
    title: "Glass Hour",
    projectMode: "screenplay",
    modeConfig: {
      draftingPreference: "script_pages",
      formatStyle: "fountain",
    },
    chapters: [
      {
        id: "scene-1",
        chapterNumber: 1,
        content: "INT. SUBWAY PLATFORM - NIGHT\nMara waits with the briefcase.",
        wordCount: 9,
      },
    ],
    fandom: "",
    characters: [],
    relationshipType: "gen",
    rating: "teen",
    tone: ["tense"],
    tropes: [],
    createdAt: "",
    updatedAt: "",
    wordCount: 9,
  };

  const file = buildStoryExportFile(story);

  assert.equal(file.extension, "fountain");
  assert.equal(file.mimeType, "text/plain;charset=utf-8");
  assert.match(file.filename, /^Glass_Hour\.fountain$/);
  assert.match(file.content, /^Title: Glass Hour/m);
  assert.match(file.content, /INT\. SUBWAY PLATFORM - NIGHT/);
});

test("screenplay beat drafts export as plain text", () => {
  const story: Story = {
    id: "screenplay-2",
    title: "Glass Hour",
    projectMode: "screenplay",
    modeConfig: {
      draftingPreference: "beat_draft",
      formatStyle: "fountain",
    },
    chapters: [
      {
        id: "scene-1",
        chapterNumber: 1,
        content: "Scene objective: Mara reaches the handoff point before dawn.",
        wordCount: 10,
      },
    ],
    fandom: "",
    characters: [],
    relationshipType: "gen",
    rating: "teen",
    tone: ["tense"],
    tropes: [],
    createdAt: "",
    updatedAt: "",
    wordCount: 10,
  };

  const file = buildStoryExportFile(story);

  assert.equal(file.extension, "txt");
  assert.match(file.filename, /^Glass_Hour\.txt$/);
});
