import { NextRequest, NextResponse } from "next/server";
import { isAdaptationOutputType } from "../../../../../lib/adaptations";
import { deleteAdaptationOutput } from "../../../../../lib/supabase/adaptations";
import { createServerSupabase } from "../../../../../lib/supabase/server";

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ storyId: string; outputType: string }>;
  }
) {
  try {
    const { storyId, outputType } = await params;
    const chapterId = req.nextUrl.searchParams.get("chapterId");

    if (!chapterId) {
      return NextResponse.json(
        { error: "chapterId is required" },
        { status: 400 }
      );
    }

    if (!isAdaptationOutputType(outputType)) {
      return NextResponse.json(
        { error: "Unsupported adaptation output type" },
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

    await deleteAdaptationOutput(supabase, storyId, chapterId, outputType);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete adaptation output:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete adaptation output";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
