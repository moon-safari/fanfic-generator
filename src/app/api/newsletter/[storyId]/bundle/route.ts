import { NextRequest, NextResponse } from "next/server";
import { buildNewsletterIssueBundle } from "../../../../lib/newsletterBundle";
import { getNewsletterModeConfig } from "../../../../lib/projectMode";
import { fetchAdaptationOutputs } from "../../../../lib/supabase/adaptations";
import { fetchNewsletterIssuePackageSelection } from "../../../../lib/supabase/newsletterIssuePackages";
import { createServerSupabase } from "../../../../lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const chapterId = req.nextUrl.searchParams.get("chapterId");

    if (!chapterId) {
      return NextResponse.json(
        { error: "chapterId is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, title, project_mode, mode_config")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (story.project_mode !== "newsletter") {
      return NextResponse.json(
        { error: "Issue bundle export is only available for newsletter projects" },
        { status: 400 }
      );
    }

    const modeConfig = getNewsletterModeConfig({
      projectMode: "newsletter",
      modeConfig: story.mode_config ?? undefined,
    });

    if (!modeConfig) {
      return NextResponse.json(
        { error: "Newsletter publication profile is not configured" },
        { status: 400 }
      );
    }

    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .select("id, story_id, chapter_number, content, summary")
      .eq("id", chapterId)
      .eq("story_id", storyId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const outputs = await fetchAdaptationOutputs(supabase, storyId, chapterId);
    const packageSelection = await fetchNewsletterIssuePackageSelection(
      supabase,
      storyId,
      chapterId
    );
    const bundle = buildNewsletterIssueBundle({
      storyTitle: story.title as string,
      chapterNumber: chapter.chapter_number as number,
      chapterContent: (chapter.content as string | null)?.trim() ?? "",
      chapterSummary: (chapter.summary as string | null) ?? null,
      modeConfig,
      outputs,
      packageSelection,
    });

    return NextResponse.json(bundle, { status: 200 });
  } catch (error) {
    console.error("Newsletter issue bundle export failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to export issue bundle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
