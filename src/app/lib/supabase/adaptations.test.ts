import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchAdaptationOutputs,
  upsertAdaptationOutput,
} from "./adaptations.ts";

test("upsertAdaptationOutput forwards lineage columns and maps returned lineage fields", async () => {
  const captured: {
    payload?: Record<string, unknown>;
    options?: Record<string, unknown>;
  } = {};
  const returnedRow = {
    id: "output-1",
    story_id: "story-1",
    chapter_id: "chapter-1",
    chapter_number: 3,
    output_type: "public_teaser",
    chain_id: "promo_chain",
    chain_step_index: 1,
    source_output_id: "output-0",
    source_output_type: "newsletter_recap",
    content: "Adapted text",
    context_source: "memory",
    created_at: "2026-04-07T10:00:00.000Z",
    updated_at: "2026-04-07T10:00:01.000Z",
  };

  const supabase = {
    from(table: string) {
      assert.equal(table, "adaptation_outputs");

      return {
        upsert(
          payload: Record<string, unknown>,
          options: Record<string, unknown>
        ) {
          captured.payload = payload;
          captured.options = options;

          return {
            select(selection: string) {
              assert.equal(selection, "*");

              return {
                async single() {
                  return { data: returnedRow, error: null };
                },
              };
            },
          };
        },
      };
    },
  };

  const result = await upsertAdaptationOutput(
    supabase as never,
    {
      storyId: "story-1",
      chapterId: "chapter-1",
      chapterNumber: 3,
      outputType: "public_teaser",
      chainId: "promo_chain",
      chainStepIndex: 1,
      sourceOutputId: "output-0",
      sourceOutputType: "newsletter_recap",
      content: "Adapted text",
      contextSource: "memory",
    }
  );

  assert.equal(captured.options?.onConflict, "story_id,chapter_id,output_type");
  assert.equal(captured.payload?.chain_id, "promo_chain");
  assert.equal(captured.payload?.chain_step_index, 1);
  assert.equal(captured.payload?.source_output_id, "output-0");
  assert.equal(captured.payload?.source_output_type, "newsletter_recap");

  assert.deepEqual(result, {
    id: "output-1",
    storyId: "story-1",
    outputType: "public_teaser",
    chainId: "promo_chain",
    chainStepIndex: 1,
    sourceOutputId: "output-0",
    sourceOutputType: "newsletter_recap",
    chapterId: "chapter-1",
    chapterNumber: 3,
    content: "Adapted text",
    contextSource: "memory",
    generatedAt: "2026-04-07T10:00:00.000Z",
    updatedAt: "2026-04-07T10:00:01.000Z",
    persisted: true,
  });
});

test("invalid lineage strings from the DB co-normalize both lineage pairs to null", async () => {
  const returnedRows = [
    {
      id: "output-2",
      story_id: "story-1",
      chapter_id: "chapter-1",
      chapter_number: 3,
      output_type: "public_teaser",
      chain_id: "unknown_chain",
      chain_step_index: 1,
      source_output_id: "output-1",
      source_output_type: "unknown_output",
      content: "Adapted text",
      context_source: "memory",
      created_at: "2026-04-07T10:00:00.000Z",
      updated_at: "2026-04-07T10:00:01.000Z",
    },
  ];

  const query = {
    eqCalls: [] as Array<{ column: string; value: string }>,
    eq(column: string, value: string) {
      this.eqCalls.push({ column, value });
      return this;
    },
    async order(column: string, options: { ascending: boolean }) {
      assert.equal(column, "updated_at");
      assert.deepEqual(options, { ascending: false });
      return { data: returnedRows, error: null };
    },
  };

  const supabase = {
    from(table: string) {
      assert.equal(table, "adaptation_outputs");

      return {
        select(selection: string) {
          assert.equal(selection, "*");
          return query;
        },
      };
    },
  };

  const [result] = await fetchAdaptationOutputs(
    supabase as never,
    "story-1",
    "chapter-1"
  );

  assert.deepEqual(query.eqCalls, [
    { column: "story_id", value: "story-1" },
    { column: "chapter_id", value: "chapter-1" },
  ]);
  assert.equal(result?.chainId, null);
  assert.equal(result?.chainStepIndex, null);
  assert.equal(result?.sourceOutputType, null);
  assert.equal(result?.sourceOutputId, null);
});
