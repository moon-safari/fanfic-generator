import { NextRequest, NextResponse } from "next/server";
import { fetchAdaptationOutputs } from "../../../../lib/supabase/adaptations";
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
      .select("id")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const results = await fetchAdaptationOutputs(supabase, storyId, chapterId);
    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch adaptation outputs:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch adaptation outputs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
