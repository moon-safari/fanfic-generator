import assert from "node:assert/strict";
import test from "node:test";
import {
  getContinueActionLabel,
  getLoadingContinueLabel,
  getProjectModeLabel,
  getProjectUnitLabel,
  parseScreenplayModeConfig,
} from "./projectMode.ts";
import { getModeConfig } from "./modes/registry.ts";

test("screenplay mode exposes scene labels and screenplay defaults", () => {
  const mode = getModeConfig("screenplay");

  assert.equal(getProjectModeLabel("screenplay"), "Screenplay");
  assert.equal(getProjectUnitLabel("screenplay"), "scene");
  assert.equal(
    getProjectUnitLabel("screenplay", { capitalize: true }),
    "Scene"
  );
  assert.equal(getContinueActionLabel("screenplay"), "Continue Scene");
  assert.equal(
    getLoadingContinueLabel("screenplay"),
    "Writing the next scene..."
  );
  assert.equal(mode.contentUnitSingular, "scene");
  assert.equal(
    mode.planningSchema.outline.description,
    "Scene-by-scene plan and status map."
  );
  assert.deepEqual(mode.coreTypes, [
    "character",
    "location",
    "prop",
    "faction",
    "setpiece",
    "theme",
  ]);
});

test("parseScreenplayModeConfig normalizes valid screenplay config", () => {
  const parsed = parseScreenplayModeConfig({
    draftingPreference: "script_pages",
    formatStyle: "fountain",
    storyEngine: "pilot",
  });

  assert.deepEqual(parsed, {
    draftingPreference: "script_pages",
    formatStyle: "fountain",
    storyEngine: "pilot",
  });
});

test("parseScreenplayModeConfig rejects incomplete screenplay config", () => {
  assert.equal(parseScreenplayModeConfig({ draftingPreference: "script_pages" }), null);
  assert.equal(parseScreenplayModeConfig({ formatStyle: "fountain" }), null);
});
