import { NextRequest, NextResponse } from "next/server";
import { detectCodexMentions } from "../../../../lib/codex/mentions";
import { fetchCodexData } from "../../../../lib/supabase/codex";
import {
  replaceCodexMentionsForChapter,
} from "../../../../lib/supabase/codexMentions";
import { authenticateCodexStory, isRouteError } from "../../shared";

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

  const auth = await authenticateCodexStory(storyId);
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
    const codex = await fetchCodexData(auth.supabase, storyId);
    const mentions = detectCodexMentions(
      (chapter.content as string) ?? "",
      codex.entries,
      chapter.chapter_number as number
    );

    const savedMentions = await replaceCodexMentionsForChapter(
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
      err instanceof Error ? err.message : "Failed to generate Codex mentions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
