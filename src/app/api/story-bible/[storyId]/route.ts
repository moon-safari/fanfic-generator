import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../../lib/supabase/server";
import { BibleSectionType, BibleSectionContent, BibleSection } from "../../../types/bible";

const ALL_SECTION_TYPES: BibleSectionType[] = [
  "characters",
  "world",
  "synopsis",
  "genre",
  "style_guide",
  "outline",
  "notes",
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify story ownership
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Fetch all bible sections
    const { data, error } = await supabase
      .from("story_bibles")
      .select("*")
      .eq("story_id", storyId);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch bible" }, { status: 500 });
    }

    const sections = Object.fromEntries(
      ALL_SECTION_TYPES.map((t) => [t, null])
    ) as Record<BibleSectionType, BibleSection | null>;

    if (data) {
      for (const row of data) {
        const section: BibleSection = {
          id: row.id as string,
          storyId: row.story_id as string,
          sectionType: row.section_type as BibleSectionType,
          content: row.content as BibleSectionContent,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
        };
        sections[section.sectionType] = section;
      }
    }

    return NextResponse.json({ storyId, sections }, { status: 200 });
  } catch (err) {
    console.error("Bible fetch error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch bible";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify story ownership
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const body = await req.json();
    const { sectionType, content } = body as {
      sectionType: BibleSectionType;
      content: BibleSectionContent;
    };

    if (!sectionType || content === undefined) {
      return NextResponse.json(
        { error: "sectionType and content are required" },
        { status: 400 }
      );
    }

    // Upsert single section
    const { data, error } = await supabase
      .from("story_bibles")
      .upsert(
        {
          story_id: storyId,
          section_type: sectionType,
          content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "story_id,section_type" }
      )
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
    }

    const section: BibleSection = {
      id: data.id as string,
      storyId: data.story_id as string,
      sectionType: data.section_type as BibleSectionType,
      content: data.content as BibleSectionContent,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };

    return NextResponse.json({ section }, { status: 200 });
  } catch (err) {
    console.error("Bible update error:", err);
    const message = err instanceof Error ? err.message : "Failed to update bible";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
