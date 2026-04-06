import assert from "node:assert/strict";
import test from "node:test";
import { getAnnotationDecorationClass } from "./annotationExtension.ts";

test("planning drift warnings use a different class than continuity warnings", () => {
  const continuityWarning = getAnnotationDecorationClass(
    "continuity_warning",
    "warning"
  );
  const planningWarning = getAnnotationDecorationClass(
    "planning_drift",
    "warning"
  );

  assert.notEqual(planningWarning, continuityWarning);
});

test("planning drift severity still changes the decoration class", () => {
  const planningInfo = getAnnotationDecorationClass("planning_drift", "info");
  const planningWarning = getAnnotationDecorationClass(
    "planning_drift",
    "warning"
  );
  const planningError = getAnnotationDecorationClass("planning_drift", "error");

  assert.notEqual(planningInfo, planningWarning);
  assert.notEqual(planningWarning, planningError);
});

test("suggestions stay visually separate from planning drift", () => {
  const suggestion = getAnnotationDecorationClass("suggestion", "info");
  const planningInfo = getAnnotationDecorationClass("planning_drift", "info");

  assert.notEqual(suggestion, planningInfo);
});
