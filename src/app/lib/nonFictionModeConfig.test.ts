import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_NON_FICTION_MODE_CONFIG,
  labelNonFictionPieceEngine,
  NON_FICTION_PIECE_ENGINES,
} from "./nonFictionModeConfig.ts";

test("non-fiction mode config exposes default setup values", () => {
  assert.deepEqual(NON_FICTION_PIECE_ENGINES, ["article", "essay"]);
  assert.deepEqual(DEFAULT_NON_FICTION_MODE_CONFIG, {
    draftingPreference: "hybrid_section_draft",
    formatStyle: "article_draft",
    pieceEngine: "article",
  });
});

test("labelNonFictionPieceEngine formats piece engine labels for UI", () => {
  assert.equal(labelNonFictionPieceEngine("article"), "Article");
  assert.equal(labelNonFictionPieceEngine("essay"), "Essay");
});
