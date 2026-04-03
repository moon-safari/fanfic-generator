import { NextRequest, NextResponse } from "next/server";
import { fetchCodexMentions } from "../../../../lib/supabase/codexMentions";
import {
  authenticateCodexStory,
  getCodexEntryRecord,
  isRouteError,
} from "../../shared";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;
  const auth = await authenticateCodexStory(storyId);

  if (isRouteError(auth)) {
    return auth.error;
  }

  const chapterId = req.nextUrl.searchParams.get("chapterId")?.trim() || undefined;
  const entryId = req.nextUrl.searchParams.get("entryId")?.trim() || undefined;

  if (chapterId) {
    const { data: chapter, error: chapterError } = await auth.supabase
      .from("chapters")
      .select("id")
      .eq("id", chapterId)
      .eq("story_id", storyId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }
  }

  if (entryId) {
    const entry = await getCodexEntryRecord(auth.supabase, storyId, entryId);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
  }

  try {
    const mentions = await fetchCodexMentions(auth.supabase, storyId, {
      chapterId,
      entryId,
    });

    return NextResponse.json({ mentions }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load mentions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
