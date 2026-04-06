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

test("comics projects export as structured plain text", () => {
  const story: Story = {
    id: "comics-1",
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
        wordCount: 13,
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
    wordCount: 13,
  };

  const file = buildStoryExportFile(story);

  assert.equal(file.extension, "txt");
  assert.match(file.filename, /^Ash_Canary\.txt$/);
  assert.match(file.content, /Mode: Comics/);
  assert.match(file.content, /PAGE 1/);
});

test("game writing projects export as structured plain text", () => {
  const story = {
    id: "story-1",
    title: "Ashes of Red Hollow",
    projectMode: "game_writing",
    modeConfig: {
      draftingPreference: "hybrid_quest_brief",
      formatStyle: "quest_brief",
      questEngine: "main_quest",
    },
    chapters: [
      {
        id: "quest-1",
        chapterNumber: 1,
        content: "QUEST 1\nPremise: The magistrate offers the player a bargain.",
        wordCount: 10,
      },
    ],
    fandom: "",
    characters: [],
    relationshipType: "gen",
    rating: "teen",
    tone: ["tense", "political"],
    tropes: [],
    createdAt: "",
    updatedAt: "",
    wordCount: 10,
  } satisfies Story;

  const exportFile = buildStoryExportFile(story);

  assert.equal(exportFile.extension, "txt");
  assert.match(exportFile.content, /Mode: Game Writing/);
  assert.match(exportFile.content, /Drafting preference: hybrid_quest_brief/);
  assert.match(exportFile.content, /Quest engine: main_quest/);
  assert.match(exportFile.content, /Quest 1/);
});
