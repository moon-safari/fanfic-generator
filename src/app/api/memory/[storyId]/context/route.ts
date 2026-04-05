import { NextRequest, NextResponse } from "next/server";
import { buildStoryContextSnapshot } from "../../../../lib/storyContext";
import { authenticateMemoryStory, isRouteError } from "../../shared";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const auth = await authenticateMemoryStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const chapterNumberParam = req.nextUrl.searchParams.get("chapterNumber");
    const parsedChapterNumber = Number.parseInt(chapterNumberParam ?? "1", 10);
    const chapterNumber =
      Number.isFinite(parsedChapterNumber) && parsedChapterNumber > 0
        ? parsedChapterNumber
        : 1;

    const context = await buildStoryContextSnapshot(
      auth.supabase,
      storyId,
      chapterNumber
    );

    return NextResponse.json({ context }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch story context:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch story context";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
