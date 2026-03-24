import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership: annotation -> chapter -> story -> user
    const { data: annotation } = await supabase
      .from("chapter_annotations")
      .select("id, chapter_id")
      .eq("id", id)
      .single();

    if (!annotation) {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }

    const { data: chapter } = await supabase
      .from("chapters")
      .select("story_id")
      .eq("id", annotation.chapter_id as string)
      .single();

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const { data: story } = await supabase
      .from("stories")
      .select("id")
      .eq("id", chapter.story_id as string)
      .eq("user_id", user.id)
      .single();

    if (!story) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("chapter_annotations")
      .update({ dismissed: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to dismiss" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Dismiss annotation error:", err);
    const message = err instanceof Error ? err.message : "Failed to dismiss annotation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
