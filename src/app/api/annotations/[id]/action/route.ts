import { NextRequest, NextResponse } from "next/server";
import { parseAnnotationMetadata } from "../../../../lib/annotationMetadata";
import {
  alignOutlineToDraft,
  markArcActive,
  markThreadResolved,
} from "../../../../lib/planning";
import { createServerSupabase } from "../../../../lib/supabase/server";
import type {
  BibleNotesContent,
  BibleOutlineContent,
  ChapterAnnotationAction,
  ChapterAnnotationMetadata,
} from "../../../../types/bible";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const action = parseAnnotationAction(body);

    if (!action) {
      return NextResponse.json(
        { error: "Invalid annotation action" },
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

    const { data: annotation } = await supabase
      .from("chapter_annotations")
      .select("id, chapter_id, annotation_type, annotation_metadata")
      .eq("id", id)
      .single();

    if (!annotation) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    const { data: chapter } = await supabase
      .from("chapters")
      .select("id, story_id, chapter_number, content, summary")
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

    const metadata = parseAnnotationMetadata(annotation.annotation_metadata);
    const nowIso = new Date().toISOString();
    const nextMetadata: ChapterAnnotationMetadata = mergeAnnotationMetadata(
      annotation.annotation_metadata,
      metadata
    );
    let focusTarget:
      | {
          sectionType: "outline" | "notes";
          targetLabel?: string;
        }
      | undefined;

    switch (action) {
      case "mark_thread_resolved": {
        if (
          annotation.annotation_type !== "planning_drift"
          || metadata?.targetSection !== "notes"
          || !metadata.targetLabel
        ) {
          return NextResponse.json(
            { error: "This annotation cannot resolve a tracked thread" },
            { status: 400 }
          );
        }

        const { data: notesRow } = await supabase
          .from("story_bibles")
          .select("content")
          .eq("story_id", story.id)
          .eq("section_type", "notes")
          .maybeSingle();

        const result = markThreadResolved(
          (notesRow?.content as BibleNotesContent | null | undefined) ?? null,
          metadata.targetLabel,
          Number(chapter.chapter_number ?? 0),
          nowIso
        );

        if (!result.matched) {
          return NextResponse.json(
            { error: "Tracked thread not found in planning notes" },
            { status: 400 }
          );
        }

        const { error: notesError } = await supabase
          .from("story_bibles")
          .upsert(
            {
              story_id: story.id,
              section_type: "notes",
              content: result.content,
              updated_at: nowIso,
            },
            { onConflict: "story_id,section_type" }
          );

        if (notesError) {
          return NextResponse.json(
            { error: "Failed to update planning notes" },
            { status: 500 }
          );
        }

        nextMetadata.resolutionState = "applied";
        focusTarget = {
          sectionType: "notes",
          targetLabel: metadata.targetLabel,
        };
        break;
      }
      case "align_outline_to_draft": {
        if (
          annotation.annotation_type !== "planning_drift"
          || metadata?.targetSection !== "outline"
        ) {
          return NextResponse.json(
            { error: "This annotation cannot update the outline" },
            { status: 400 }
          );
        }

        const { data: outlineRow } = await supabase
          .from("story_bibles")
          .select("content")
          .eq("story_id", story.id)
          .eq("section_type", "outline")
          .maybeSingle();

        const result = alignOutlineToDraft(
          (outlineRow?.content as BibleOutlineContent | null | undefined) ?? null,
          Number(chapter.chapter_number ?? 0),
          {
            reasonType:
              metadata.reasonType === "reveal_drift"
                ? "reveal_drift"
                : "intent_miss",
            chapterSummary:
              typeof chapter.summary === "string" ? chapter.summary : undefined,
            chapterContent:
              typeof chapter.content === "string" ? chapter.content : "",
            targetLabel: metadata.targetLabel,
            timestampLabel: nowIso,
          }
        );

        const { error: outlineError } = await supabase
          .from("story_bibles")
          .upsert(
            {
              story_id: story.id,
              section_type: "outline",
              content: result.content,
              updated_at: nowIso,
            },
            { onConflict: "story_id,section_type" }
          );

        if (outlineError) {
          return NextResponse.json(
            { error: "Failed to update outline" },
            { status: 500 }
          );
        }

        nextMetadata.resolutionState = "applied";
        focusTarget = {
          sectionType: "outline",
          targetLabel: metadata.targetLabel,
        };
        break;
      }
      case "mark_arc_active": {
        if (
          annotation.annotation_type !== "planning_drift"
          || metadata?.targetSection !== "notes"
          || metadata?.reasonType !== "arc_drift"
          || !metadata.targetLabel
        ) {
          return NextResponse.json(
            { error: "This annotation cannot update arc status" },
            { status: 400 }
          );
        }

        const { data: notesRow } = await supabase
          .from("story_bibles")
          .select("content")
          .eq("story_id", story.id)
          .eq("section_type", "notes")
          .maybeSingle();

        const result = markArcActive(
          (notesRow?.content as BibleNotesContent | null | undefined) ?? null,
          metadata.targetLabel,
          Number(chapter.chapter_number ?? 0),
          nowIso
        );

        if (!result.matched) {
          return NextResponse.json(
            { error: "Tracked arc not found in planning notes" },
            { status: 400 }
          );
        }

        const { error: notesError } = await supabase
          .from("story_bibles")
          .upsert(
            {
              story_id: story.id,
              section_type: "notes",
              content: result.content,
              updated_at: nowIso,
            },
            { onConflict: "story_id,section_type" }
          );

        if (notesError) {
          return NextResponse.json(
            { error: "Failed to update arc status" },
            { status: 500 }
          );
        }

        nextMetadata.resolutionState = "applied";
        focusTarget = {
          sectionType: "notes",
          targetLabel: metadata.targetLabel,
        };
        break;
      }
      case "mark_intentional_divergence":
        nextMetadata.resolutionState = "intentional_divergence";
        break;
    }

    const { error: annotationError } = await supabase
      .from("chapter_annotations")
      .update({
        dismissed: true,
        annotation_metadata: nextMetadata,
        updated_at: nowIso,
      })
      .eq("id", id);

    if (annotationError) {
      return NextResponse.json(
        { error: "Failed to update annotation state" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        resolutionState: nextMetadata.resolutionState ?? "open",
        focusTarget,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Annotation action error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to apply annotation action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseAnnotationAction(
  input: unknown
): ChapterAnnotationAction | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const action = (input as { action?: unknown }).action;
  return action === "mark_thread_resolved"
    || action === "align_outline_to_draft"
    || action === "mark_arc_active"
    || action === "mark_intentional_divergence"
    ? action
    : null;
}

function mergeAnnotationMetadata(
  existing: unknown,
  parsed: ChapterAnnotationMetadata | undefined
): ChapterAnnotationMetadata {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? ({ ...existing } as ChapterAnnotationMetadata)
      : {};

  return parsed ? { ...base, ...parsed } : base;
}
