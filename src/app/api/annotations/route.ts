import { NextRequest, NextResponse } from "next/server";
import { parseAnnotationMetadata } from "../../lib/annotationMetadata";
import { createServerSupabase } from "../../lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chapterId = req.nextUrl.searchParams.get("chapterId");
    if (!chapterId) {
      return NextResponse.json(
        { error: "chapterId is required" },
        { status: 400 }
      );
    }

    // Verify chapter ownership through story
    const { data: chapter } = await supabase
      .from("chapters")
      .select("id, story_id")
      .eq("id", chapterId)
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

    const { data, error } = await supabase
      .from("chapter_annotations")
      .select("*")
      .eq("chapter_id", chapterId)
      .eq("dismissed", false);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch annotations" }, { status: 500 });
    }

    const annotations = (data ?? []).map((row) => ({
      id: row.id as string,
      chapterId: row.chapter_id as string,
      textMatch: row.text_match as string,
      annotationType: row.annotation_type as "continuity_warning" | "planning_drift" | "suggestion",
      message: row.message as string,
      sourceChapter:
        row.source_chapter === null || row.source_chapter === undefined
          ? ""
          : String(row.source_chapter),
      severity: row.severity as string,
      metadata: parseAnnotationMetadata(row.annotation_metadata),
      dismissed: row.dismissed as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));

    return NextResponse.json({ annotations }, { status: 200 });
  } catch (err) {
    console.error("Fetch annotations error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch annotations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
