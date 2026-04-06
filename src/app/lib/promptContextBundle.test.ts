import assert from "node:assert/strict";
import test from "node:test";
import { resolvePromptContextBundle } from "./promptContextBundle.ts";

test("resolvePromptContextBundle uses the next unit for planning by default", async () => {
  const calls = {
    storyContext: null as null | {
      storyId: string;
      resolvedThroughUnitNumber: number;
      projectMode: string;
    },
    planningContext: null as null | {
      storyId: string;
      planningUnitNumber: number;
      projectMode: string;
    },
  };

  const result = await resolvePromptContextBundle(
    {} as never,
    "story-123",
    { resolvedThroughUnitNumber: 4 },
    {
      fetchStoryPromptMeta: async () => ({
        title: "The Archive Below",
        projectMode: "newsletter",
      }),
      resolveStoryContext: async (_supabase, storyId, resolvedThroughUnitNumber, storyMeta) => {
        calls.storyContext = {
          storyId,
          resolvedThroughUnitNumber,
          projectMode: storyMeta?.projectMode ?? "none",
        };

        return {
          text: "=== MEMORY ===\nResolved context",
          source: "memory",
        };
      },
      resolvePlanningContext: async (_supabase, storyId, planningUnitNumber, projectMode) => {
        calls.planningContext = {
          storyId,
          planningUnitNumber,
          projectMode,
        };

        return "=== PLANNING GUIDANCE ===\nTarget Issue 5";
      },
    }
  );

  assert.deepEqual(calls.storyContext, {
    storyId: "story-123",
    resolvedThroughUnitNumber: 4,
    projectMode: "newsletter",
  });
  assert.deepEqual(calls.planningContext, {
    storyId: "story-123",
    planningUnitNumber: 5,
    projectMode: "newsletter",
  });
  assert.equal(result.projectMode, "newsletter");
  assert.equal(result.planningUnitNumber, 5);
  assert.equal(result.storyContext.source, "memory");
  assert.equal(result.planningContext, "=== PLANNING GUIDANCE ===\nTarget Issue 5");
});

test("resolvePromptContextBundle respects an explicit planning unit and falls back to fiction", async () => {
  const calls = {
    storyContext: null as null | {
      resolvedThroughUnitNumber: number;
      projectMode: string;
    },
    planningContext: null as null | {
      planningUnitNumber: number;
      projectMode: string;
    },
  };

  const result = await resolvePromptContextBundle(
    {} as never,
    "story-456",
    {
      resolvedThroughUnitNumber: 2,
      planningUnitNumber: 7,
    },
    {
      fetchStoryPromptMeta: async () => null,
      resolveStoryContext: async (_supabase, _storyId, resolvedThroughUnitNumber, storyMeta) => {
        calls.storyContext = {
          resolvedThroughUnitNumber,
          projectMode: storyMeta?.projectMode ?? "none",
        };

        return {
          text: "",
          source: "none",
        };
      },
      resolvePlanningContext: async (_supabase, _storyId, planningUnitNumber, projectMode) => {
        calls.planningContext = {
          planningUnitNumber,
          projectMode,
        };

        return "";
      },
    }
  );

  assert.deepEqual(calls.storyContext, {
    resolvedThroughUnitNumber: 2,
    projectMode: "none",
  });
  assert.deepEqual(calls.planningContext, {
    planningUnitNumber: 7,
    projectMode: "fiction",
  });
  assert.equal(result.projectMode, "fiction");
  assert.equal(result.planningUnitNumber, 7);
  assert.equal(result.storyContext.source, "none");
  assert.equal(result.planningContext, "");
});
