import { NextRequest, NextResponse } from "next/server";
import {
  NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELDS,
  type NewsletterIssuePackageSelectionField,
} from "../../../../types/newsletter";
import {
  createEmptyNewsletterIssuePackageSelection,
  fetchNewsletterIssuePackageSelection,
  upsertNewsletterIssuePackageSelectionField,
} from "../../../../lib/supabase/newsletterIssuePackages";
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
      .select("id, project_mode")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (story.project_mode !== "newsletter") {
      return NextResponse.json(
        { error: "Canonical issue package state is only available for newsletter projects" },
        { status: 400 }
      );
    }

    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .select("id, chapter_number")
      .eq("id", chapterId)
      .eq("story_id", storyId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const selection = await fetchNewsletterIssuePackageSelection(
      supabase,
      storyId,
      chapterId
    );

    return NextResponse.json(
      {
        selection:
          selection
          ?? createEmptyNewsletterIssuePackageSelection({
            storyId,
            chapterId,
            chapterNumber: chapter.chapter_number as number,
          }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch newsletter issue package selection:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch newsletter issue package selection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const body = (await req.json()) as {
      chapterId?: string;
      field?: string;
      value?: string;
    };

    if (!body.chapterId) {
      return NextResponse.json(
        { error: "chapterId is required" },
        { status: 400 }
      );
    }

    if (!isSelectionField(body.field)) {
      return NextResponse.json(
        { error: "Unsupported newsletter issue package field" },
        { status: 400 }
      );
    }

    if (typeof body.value !== "string") {
      return NextResponse.json(
        { error: "value must be a string" },
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
      .select("id, project_mode")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (story.project_mode !== "newsletter") {
      return NextResponse.json(
        { error: "Canonical issue package state is only available for newsletter projects" },
        { status: 400 }
      );
    }

    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .select("id, chapter_number")
      .eq("id", body.chapterId)
      .eq("story_id", storyId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const selection = await upsertNewsletterIssuePackageSelectionField(
      supabase,
      {
        storyId,
        chapterId: body.chapterId,
        chapterNumber: chapter.chapter_number as number,
        field: body.field,
        value: body.value,
      }
    );

    return NextResponse.json({ selection }, { status: 200 });
  } catch (error) {
    console.error("Failed to update newsletter issue package selection:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update newsletter issue package selection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isSelectionField(
  value: string | undefined
): value is NewsletterIssuePackageSelectionField {
  return (
    typeof value === "string"
    && NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELDS.includes(
      value as NewsletterIssuePackageSelectionField
    )
  );
}
