import { NextResponse } from "next/server";
import { detectCodexMentions } from "../../../lib/codex/mentions";
import type { CodexChangeSuggestionPayload } from "../../../types/codex";
import {
  fetchCodexData,
  insertCodexCustomType,
  insertCodexEntry,
  insertCodexProgression,
  insertCodexRelationship,
} from "../../../lib/supabase/codex";
import { insertCodexMentions } from "../../../lib/supabase/codexMentions";
import { insertCodexChangeSuggestions } from "../../../lib/supabase/codexSuggestions";
import {
  buildShowcaseStory,
  CODEX_SHOWCASE_CHAPTERS,
  CODEX_SHOWCASE_CUSTOM_FANDOM,
  CODEX_SHOWCASE_CUSTOM_TYPES,
  CODEX_SHOWCASE_ENTRIES,
  CODEX_SHOWCASE_PROGRESSIONS,
  CODEX_SHOWCASE_RELATIONSHIPS,
  CODEX_SHOWCASE_STORY,
  CODEX_SHOWCASE_SUGGESTIONS,
  CODEX_SHOWCASE_TITLE,
  countWords,
  type ShowcaseChapterRow,
  type ShowcaseStoryRow,
} from "../../../lib/demo/codexShowcase";
import { createServerSupabase, createServiceRoleSupabase } from "../../../lib/supabase/server";

type InsertedStoryRow = ShowcaseStoryRow & {
  user_id: string;
};

export async function POST() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceSupabase = await createServiceRoleSupabase();

    const { data: existingStory } = await serviceSupabase
      .from("stories")
      .select("id")
      .eq("user_id", user.id)
      .eq("title", CODEX_SHOWCASE_TITLE)
      .eq("custom_fandom", CODEX_SHOWCASE_CUSTOM_FANDOM)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingStory?.id) {
      await ensureShowcaseMentions(serviceSupabase, existingStory.id);
      const story = await fetchStoryById(serviceSupabase, existingStory.id);
      if (story) {
        return NextResponse.json({ story, existing: true }, { status: 200 });
      }
    }

    const now = new Date().toISOString();
    const totalWordCount = CODEX_SHOWCASE_CHAPTERS.reduce(
      (sum, chapter) => sum + countWords(chapter.content),
      0
    );

    const { data: insertedStory, error: storyError } = await serviceSupabase
      .from("stories")
      .insert({
        user_id: user.id,
        title: CODEX_SHOWCASE_STORY.title,
        project_mode: "fiction",
        mode_config: {},
        fandom: CODEX_SHOWCASE_STORY.fandom,
        custom_fandom: CODEX_SHOWCASE_STORY.customFandom,
        characters: CODEX_SHOWCASE_STORY.characters,
        relationship_type: CODEX_SHOWCASE_STORY.relationshipType,
        rating: CODEX_SHOWCASE_STORY.rating,
        setting: CODEX_SHOWCASE_STORY.setting,
        tone: CODEX_SHOWCASE_STORY.tone,
        tropes: CODEX_SHOWCASE_STORY.tropes,
        word_count: totalWordCount,
        updated_at: now,
      })
      .select("*")
      .single();

    if (storyError || !insertedStory) {
      console.error("Demo story insert error:", storyError);
      return NextResponse.json(
        { error: "Failed to create Codex showcase story" },
        { status: 500 }
      );
    }

    const storyId = (insertedStory as InsertedStoryRow).id;

    const { data: insertedChapters, error: chapterError } = await serviceSupabase
      .from("chapters")
      .insert(
        CODEX_SHOWCASE_CHAPTERS.map((chapter) => ({
          story_id: storyId,
          chapter_number: chapter.chapterNumber,
          content: chapter.content,
          summary: chapter.summary,
          word_count: countWords(chapter.content),
        }))
      )
      .select("*");

    if (chapterError || !insertedChapters) {
      console.error("Demo chapter insert error:", chapterError);
      await deleteStorySilently(serviceSupabase, storyId);
      return NextResponse.json(
        { error: "Failed to create showcase chapters" },
        { status: 500 }
      );
    }

    const chapterIdByNumber = new Map<number, string>();
    for (const chapter of insertedChapters as ShowcaseChapterRow[]) {
      chapterIdByNumber.set(chapter.chapter_number, chapter.id);
    }

    for (const customType of CODEX_SHOWCASE_CUSTOM_TYPES) {
      await insertCodexCustomType(serviceSupabase, storyId, customType);
    }

    const entryIdByKey = new Map<string, string>();
    for (const entry of CODEX_SHOWCASE_ENTRIES) {
      const insertedEntry = await insertCodexEntry(serviceSupabase, storyId, entry);
      if (!insertedEntry) {
        await deleteStorySilently(serviceSupabase, storyId);
        return NextResponse.json(
          { error: `Failed to create showcase entry: ${entry.name}` },
          { status: 500 }
        );
      }

      entryIdByKey.set(entry.key, insertedEntry.id);
    }

    for (const relationship of CODEX_SHOWCASE_RELATIONSHIPS) {
      const sourceEntryId = entryIdByKey.get(relationship.sourceKey);
      const targetEntryId = entryIdByKey.get(relationship.targetKey);

      if (!sourceEntryId || !targetEntryId) {
        continue;
      }

      await insertCodexRelationship(serviceSupabase, storyId, {
        sourceEntryId,
        targetEntryId,
        forwardLabel: relationship.forwardLabel,
        reverseLabel: relationship.reverseLabel,
      });
    }

    for (const progression of CODEX_SHOWCASE_PROGRESSIONS) {
      const entryId = entryIdByKey.get(progression.entryKey);
      if (!entryId) {
        continue;
      }

      await insertCodexProgression(serviceSupabase, entryId, progression);
    }

    const codex = await fetchCodexData(serviceSupabase, storyId);
    const mentionRows = CODEX_SHOWCASE_CHAPTERS.flatMap((chapter) => {
      const chapterId = chapterIdByNumber.get(chapter.chapterNumber);
      if (!chapterId) {
        return [];
      }

      return detectCodexMentions(
        chapter.content,
        codex.entries,
        chapter.chapterNumber
      ).map((mention) => ({
        story_id: storyId,
        chapter_id: chapterId,
        chapter_number: chapter.chapterNumber,
        entry_id: mention.entryId,
        matched_text: mention.matchedText,
        matched_alias: mention.matchedAlias ?? null,
        start_index: mention.startIndex,
        end_index: mention.endIndex,
      }));
    });

    if (mentionRows.length > 0) {
      await insertCodexMentions(serviceSupabase, mentionRows);
    }

    const suggestionRows = CODEX_SHOWCASE_SUGGESTIONS.flatMap((suggestion) => {
      const chapterId = chapterIdByNumber.get(suggestion.chapterNumber);
      if (!chapterId) {
        return [];
      }

      const targetEntryId = suggestion.targetEntryKey
        ? entryIdByKey.get(suggestion.targetEntryKey) ?? null
        : null;

      const payload = withResolvedSuggestionPayload(
        suggestion.payload,
        entryIdByKey
      );

      return [
        {
          story_id: storyId,
          chapter_id: chapterId,
          chapter_number: suggestion.chapterNumber,
          target_entry_id: targetEntryId,
          change_type: suggestion.changeType,
          payload,
          evidence_text: suggestion.evidenceText ?? null,
          rationale: suggestion.rationale ?? null,
          confidence: suggestion.confidence ?? "medium",
          status: suggestion.status ?? "pending",
          reviewed_at: suggestion.reviewedAt ?? null,
          applied_at: suggestion.appliedAt ?? null,
        },
      ];
    });

    if (suggestionRows.length > 0) {
      await insertCodexChangeSuggestions(serviceSupabase, suggestionRows);
    }

    const story = await fetchStoryById(serviceSupabase, storyId);
    if (!story) {
      return NextResponse.json(
        { error: "Showcase story created but could not be loaded" },
        { status: 500 }
      );
    }

    return NextResponse.json({ story, existing: false }, { status: 201 });
  } catch (err) {
    console.error("Codex showcase create error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create Codex showcase";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function fetchStoryById(
  supabase: Awaited<ReturnType<typeof createServiceRoleSupabase>>,
  storyId: string
) {
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("*")
    .eq("id", storyId)
    .single();

  if (storyError || !story) {
    return null;
  }

  const { data: chapters, error: chapterError } = await supabase
    .from("chapters")
    .select("id, story_id, chapter_number, content, summary, word_count")
    .eq("story_id", storyId)
    .order("chapter_number", { ascending: true });

  if (chapterError || !chapters) {
    return null;
  }

  return buildShowcaseStory(
    story as ShowcaseStoryRow,
    chapters as ShowcaseChapterRow[]
  );
}

async function deleteStorySilently(
  supabase: Awaited<ReturnType<typeof createServiceRoleSupabase>>,
  storyId: string
) {
  await supabase.from("stories").delete().eq("id", storyId);
}

async function ensureShowcaseMentions(
  supabase: Awaited<ReturnType<typeof createServiceRoleSupabase>>,
  storyId: string
) {
  const { count, error: countError } = await supabase
    .from("codex_mentions")
    .select("id", { count: "exact", head: true })
    .eq("story_id", storyId);

  if (countError || (count ?? 0) > 0) {
    return;
  }

  const codex = await fetchCodexData(supabase, storyId);
  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("id, chapter_number, content")
    .eq("story_id", storyId)
    .order("chapter_number", { ascending: true });

  if (chaptersError || !chapters) {
    return;
  }

  const mentionRows = chapters.flatMap((chapter) =>
    detectCodexMentions(
      chapter.content as string,
      codex.entries,
      chapter.chapter_number as number
    ).map((mention) => ({
      story_id: storyId,
      chapter_id: chapter.id as string,
      chapter_number: chapter.chapter_number as number,
      entry_id: mention.entryId,
      matched_text: mention.matchedText,
      matched_alias: mention.matchedAlias ?? null,
      start_index: mention.startIndex,
      end_index: mention.endIndex,
    }))
  );

  if (mentionRows.length > 0) {
    await insertCodexMentions(supabase, mentionRows);
  }
}

function withResolvedSuggestionPayload(
  payload: CodexChangeSuggestionPayload,
  entryIdByKey: Map<string, string>
): Record<string, unknown> {
  const nextPayload = { ...payload } as Record<string, unknown>;

  if (typeof nextPayload.entryId === "string" && nextPayload.entryId === "") {
    const entryName =
      typeof nextPayload.entryName === "string" ? nextPayload.entryName : "";
    const resolvedId = resolveEntryIdByName(entryName, entryIdByKey);
    if (resolvedId) {
      nextPayload.entryId = resolvedId;
    } else {
      delete nextPayload.entryId;
    }
  }

  if (
    typeof nextPayload.sourceEntryId === "string" &&
    nextPayload.sourceEntryId === ""
  ) {
    const sourceEntryName =
      typeof nextPayload.sourceEntryName === "string"
        ? nextPayload.sourceEntryName
        : "";
    const resolvedId = resolveEntryIdByName(sourceEntryName, entryIdByKey);
    if (resolvedId) {
      nextPayload.sourceEntryId = resolvedId;
    } else {
      delete nextPayload.sourceEntryId;
    }
  }

  if (
    typeof nextPayload.targetEntryId === "string" &&
    nextPayload.targetEntryId === ""
  ) {
    const targetEntryName =
      typeof nextPayload.targetEntryName === "string"
        ? nextPayload.targetEntryName
        : "";
    const resolvedId = resolveEntryIdByName(targetEntryName, entryIdByKey);
    if (resolvedId) {
      nextPayload.targetEntryId = resolvedId;
    } else {
      delete nextPayload.targetEntryId;
    }
  }

  return nextPayload;
}

function resolveEntryIdByName(
  entryName: string,
  entryIdByKey: Map<string, string>
) {
  const normalizedEntryName = normalizeNameKey(entryName);
  const match = CODEX_SHOWCASE_ENTRIES.find(
    (entry) => normalizeNameKey(entry.name) === normalizedEntryName
  );

  return match ? entryIdByKey.get(match.key) ?? null : null;
}

function normalizeNameKey(value: string): string {
  return value.trim().toLowerCase();
}
