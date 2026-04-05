import { NextRequest, NextResponse } from "next/server";
import { detectMemoryMentions } from "../../../../lib/memory/mentions";
import { fetchMemoryData } from "../../../../lib/supabase/memory";
import {
  replaceMemoryMentionsForChapter,
} from "../../../../lib/supabase/memoryMentions";
import { authenticateMemoryStory, isRouteError } from "../../shared";

export async function POST(req: NextRequest) {
  let body: { storyId?: string; chapterId?: string };

  try {
    body = (await req.json()) as { storyId?: string; chapterId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const storyId = body.storyId?.trim();
  const chapterId = body.chapterId?.trim();

  if (!storyId || !chapterId) {
    return NextResponse.json(
      { error: "storyId and chapterId are required" },
      { status: 400 }
    );
  }

  const auth = await authenticateMemoryStory(storyId);
  if (isRouteError(auth)) {
    return auth.error;
  }

  const { data: chapter, error: chapterError } = await auth.supabase
    .from("chapters")
    .select("id, story_id, chapter_number, content")
    .eq("id", chapterId)
    .eq("story_id", storyId)
    .single();

  if (chapterError || !chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  try {
    const memory = await fetchMemoryData(auth.supabase, storyId);
    const mentions = detectMemoryMentions(
      (chapter.content as string) ?? "",
      memory.entries,
      chapter.chapter_number as number
    );

    const savedMentions = await replaceMemoryMentionsForChapter(
      auth.supabase,
      storyId,
      chapterId,
      mentions.map((mention) => ({
        story_id: storyId,
        chapter_id: chapterId,
        chapter_number: chapter.chapter_number as number,
        entry_id: mention.entryId,
        matched_text: mention.matchedText,
        matched_alias: mention.matchedAlias ?? null,
        start_index: mention.startIndex,
        end_index: mention.endIndex,
      }))
    );

    return NextResponse.json({ mentions: savedMentions }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate Memory mentions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
