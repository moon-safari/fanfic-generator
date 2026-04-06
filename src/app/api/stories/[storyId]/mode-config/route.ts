import { NextRequest, NextResponse } from "next/server";
import type { ProjectMode } from "../../../../types/story";
import { parseStoryModeConfig } from "../../../../lib/projectMode";
import { createServerSupabase } from "../../../../lib/supabase/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const body = await req.json();
    const candidate = body && typeof body === "object" ? body.modeConfig : undefined;

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, project_mode")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if ((story.project_mode as string | undefined) === "fiction") {
      return NextResponse.json(
        { error: "Mode config editing is not available for fiction projects" },
        { status: 400 }
      );
    }

    const modeConfig = parseStoryModeConfig(
      (story.project_mode as ProjectMode | undefined) ?? "fiction",
      candidate
    );

    if (!modeConfig) {
      return NextResponse.json(
        { error: "Invalid mode config" },
        { status: 400 }
      );
    }

    const updatedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("stories")
      .update({
        mode_config: modeConfig,
        updated_at: updatedAt,
      })
      .eq("id", storyId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update newsletter profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { modeConfig, updatedAt },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update story mode config:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update mode config";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
