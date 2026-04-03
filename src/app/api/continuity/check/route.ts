import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildAnnotationResolutionKey,
  isResolvedAnnotationMetadata,
  parseAnnotationMetadata,
} from "../../../lib/annotationMetadata";
import { buildPlanningContinuityContext } from "../../../lib/planning";
import { createServerSupabase } from "../../../lib/supabase/server";
import { buildContinuityCheckPrompt } from "../../../lib/prompts/continuity";
import { resolvePromptStoryContext } from "../../../lib/storyContext";
import type {
  BibleNotesContent,
  BibleOutlineContent,
  BibleStyleGuideContent,
  BibleSynopsisContent,
  ChapterAnnotationMetadata,
} from "../../../types/bible";
import type { ProjectMode } from "../../../types/story";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ParsedContinuityAnnotation {
  text: string;
  issue: string;
  sourceChapter: number;
  severity: "info" | "warning" | "error";
  annotationType: "continuity_warning" | "planning_drift";
  metadata?: ChapterAnnotationMetadata;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { storyId, chapterId } = body as { storyId: string; chapterId: string };

    if (!storyId || !chapterId) {
      return NextResponse.json(
        { error: "storyId and chapterId are required" },
        { status: 400 }
      );
    }

    // Verify story ownership
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, project_mode")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Fetch chapter content and number
    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .select("id, content, chapter_number")
      .eq("id", chapterId)
      .eq("story_id", storyId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const { text: storyContext } = await resolvePromptStoryContext(
      supabase,
      storyId,
      Math.max(1, (chapter.chapter_number as number) - 1)
    );

    const { data: planningSectionsData, error: planningError } = await supabase
      .from("story_bibles")
      .select("section_type, content")
      .eq("story_id", storyId)
      .in("section_type", ["synopsis", "style_guide", "outline", "notes"]);

    if (planningError) {
      return NextResponse.json(
        { error: "Failed to fetch planning context" },
        { status: 500 }
      );
    }

    const outlineContent =
      (planningSectionsData ?? []).find((section) => section.section_type === "outline")
        ?.content as BibleOutlineContent | undefined;
    const notesContent =
      (planningSectionsData ?? []).find((section) => section.section_type === "notes")
        ?.content as BibleNotesContent | undefined;
    const synopsisContent =
      (planningSectionsData ?? []).find((section) => section.section_type === "synopsis")
        ?.content as BibleSynopsisContent | undefined;
    const styleGuideContent =
      (planningSectionsData ?? []).find((section) => section.section_type === "style_guide")
        ?.content as BibleStyleGuideContent | undefined;

    // Fetch summaries from previous chapters
    const { data: previousChaptersData } = await supabase
      .from("chapters")
      .select("chapter_number, summary")
      .eq("story_id", storyId)
      .lt("chapter_number", chapter.chapter_number as number)
      .order("chapter_number", { ascending: true });

    const previousSummaries = (previousChaptersData ?? [])
      .filter((c) => c.summary)
      .map((c) => ({
        number: c.chapter_number as number,
        summary: c.summary as string,
      }));

    const projectMode = (story.project_mode as ProjectMode | undefined) ?? "fiction";

    const { data: dismissedAnnotationsData, error: dismissedAnnotationsError } =
      await supabase
        .from("chapter_annotations")
        .select("text_match, annotation_type, source_chapter, annotation_metadata")
        .eq("chapter_id", chapterId)
        .eq("dismissed", true);

    if (dismissedAnnotationsError) {
      return NextResponse.json(
        { error: "Failed to fetch annotation history" },
        { status: 500 }
      );
    }

    const resolvedAnnotationKeys = new Set(
      (dismissedAnnotationsData ?? [])
        .map((row) => ({
          annotationType: row.annotation_type as string,
          textMatch: row.text_match as string,
          sourceChapter: row.source_chapter as string | number | null,
          metadata: parseAnnotationMetadata(row.annotation_metadata),
        }))
        .filter((row) => isResolvedAnnotationMetadata(row.metadata))
        .map((row) => buildAnnotationResolutionKey(row))
    );

    const planningContext = buildPlanningContinuityContext({
      outline: outlineContent,
      notes: notesContent,
      unitNumber: chapter.chapter_number as number,
      projectMode,
    });
    const prompt = buildContinuityCheckPrompt(
      chapter.content as string,
      chapter.chapter_number as number,
      storyContext,
      previousSummaries,
      projectMode,
      planningContext
    );

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let annotations: ParsedContinuityAnnotation[] = [];

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const rawAnnotations = Array.isArray(parsed.annotations)
          ? (parsed.annotations as Array<{
              text?: unknown;
              issue?: unknown;
              sourceChapter?: unknown;
              severity?: unknown;
              annotationType?: unknown;
              metadata?: unknown;
            }>)
          : [];

        annotations = rawAnnotations.map(
          (annotation: {
            text?: unknown;
            issue?: unknown;
            sourceChapter?: unknown;
            severity?: unknown;
            annotationType?: unknown;
            metadata?: unknown;
          }): ParsedContinuityAnnotation => ({
            text:
              typeof annotation.text === "string" ? annotation.text : "",
            issue:
              typeof annotation.issue === "string" ? annotation.issue : "",
            sourceChapter:
              typeof annotation.sourceChapter === "number"
                ? annotation.sourceChapter
                : 0,
            severity:
              annotation.severity === "error"
              || annotation.severity === "warning"
              || annotation.severity === "info"
                ? annotation.severity
                : "warning",
              annotationType:
              annotation.annotationType === "planning_drift"
                ? "planning_drift"
                : "continuity_warning",
            metadata: enrichContinuityMetadata(
              parseAnnotationMetadata(annotation.metadata),
              chapter.chapter_number as number,
              synopsisContent,
              styleGuideContent,
              outlineContent,
              notesContent
            ),
          })
        ).filter((annotation: ParsedContinuityAnnotation) => {
          if (!annotation.text || !annotation.issue) {
            return false;
          }

          const resolutionKey = buildAnnotationResolutionKey({
            annotationType: annotation.annotationType,
            textMatch: annotation.text,
            sourceChapter: annotation.sourceChapter,
            metadata: annotation.metadata,
          });

          return !resolvedAnnotationKeys.has(resolutionKey);
        });
      } catch {
        annotations = [];
      }
    }

    // Clear old non-dismissed annotations and insert new ones
    const { error: deleteError } = await supabase
      .from("chapter_annotations")
      .delete()
      .eq("chapter_id", chapterId)
      .eq("dismissed", false);

    if (deleteError) {
      console.error("Failed to clear old annotations:", deleteError);
    }

    if (annotations.length > 0) {
      const rows = annotations.map((a) => ({
        chapter_id: chapterId,
        text_match: a.text,
        annotation_type: a.annotationType,
        message: a.issue,
        source_chapter: a.sourceChapter,
        severity: a.severity,
        annotation_metadata: a.metadata ?? {},
        dismissed: false,
      }));

      const { data: insertedRows, error: insertError } = await supabase
        .from("chapter_annotations")
        .insert(rows)
        .select();

      if (insertError) {
        console.error("Failed to insert annotations:", insertError);
        return NextResponse.json(
          { error: "Failed to persist annotations" },
          { status: 500 }
        );
      }

      const persistedAnnotations = (insertedRows ?? []).map((row) => ({
        id: row.id as string,
        chapterId: row.chapter_id as string,
        textMatch: row.text_match as string,
        annotationType: row.annotation_type as string,
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

      return NextResponse.json({ annotations: persistedAnnotations }, { status: 200 });
    }

    return NextResponse.json({ annotations: [] }, { status: 200 });
  } catch (err) {
    console.error("Continuity check error:", err);
    const message = err instanceof Error ? err.message : "Continuity check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function enrichContinuityMetadata(
  metadata: ChapterAnnotationMetadata | undefined,
  unitNumber: number,
  synopsisContent: BibleSynopsisContent | undefined,
  styleGuideContent: BibleStyleGuideContent | undefined,
  outlineContent: BibleOutlineContent | undefined,
  notesContent: BibleNotesContent | undefined
) {
  if (!metadata) {
    return undefined;
  }

  const enriched: ChapterAnnotationMetadata = { ...metadata };

  if (metadata.targetSection === "synopsis" && metadata.reasonType === "promise_drift") {
    const synopsis = synopsisContent?.text?.trim();

    if (synopsis) {
      enriched.targetState = synopsis;
      enriched.reasonDetail =
        metadata.reasonDetail
        ?? `This issue appears to drift from the established series promise: ${synopsis}`;
    }
  }

  if (metadata.targetSection === "style_guide" && metadata.reasonType === "voice_drift") {
    const styleGuideSummary = formatStyleGuideSummary(styleGuideContent);

    if (styleGuideSummary) {
      enriched.targetState = styleGuideSummary;
      enriched.reasonDetail =
        metadata.reasonDetail
        ?? `This issue appears to break the stored writing voice or editorial style: ${styleGuideSummary}`;
    }
  }

  if (metadata.targetSection === "outline") {
    const currentUnit = outlineContent?.chapters.find(
      (chapter) => chapter.number === unitNumber
    );

    if (metadata.reasonType === "intent_miss" && currentUnit?.intent?.trim()) {
      enriched.targetState = currentUnit.intent.trim();
      enriched.reasonDetail =
        metadata.reasonDetail
        ?? `This unit was planned to focus on: ${currentUnit.intent.trim()}`;
    }

    if (metadata.reasonType === "reveal_drift" && currentUnit?.keyReveal?.trim()) {
      enriched.targetState = currentUnit.keyReveal.trim();
      enriched.reasonDetail =
        metadata.reasonDetail
        ?? `This unit was expected to reveal or turn on: ${currentUnit.keyReveal.trim()}`;
    }

    if (metadata.reasonType === "hook_drift") {
      const hookTarget =
        currentUnit?.intent?.trim()
        || currentUnit?.summary?.trim()
        || synopsisContent?.text?.trim()
        || "";

      if (hookTarget) {
        enriched.targetState = hookTarget;
        enriched.reasonDetail =
          metadata.reasonDetail
          ?? `The opening of this issue does not clearly tee up the planned angle or reader promise: ${hookTarget}`;
      }
    }
  }

  if (metadata.targetSection === "notes" && metadata.targetLabel?.trim()) {
    const normalizedTarget = metadata.targetLabel.trim().toLowerCase();

    if (metadata.reasonType === "due_thread") {
      const thread = notesContent?.threads?.find(
        (candidate) => candidate.title.trim().toLowerCase() === normalizedTarget
      );

      if (thread) {
        enriched.targetState = capitalize(thread.status);
        if (typeof thread.targetUnit === "number") {
          enriched.targetUnit = thread.targetUnit;
        }
        enriched.reasonDetail =
          metadata.reasonDetail
          ?? `This tracked thread was due by unit ${thread.targetUnit ?? unitNumber} but is still ${thread.status}.`;
      }
    }

    if (metadata.reasonType === "arc_drift") {
      const arc = notesContent?.arcs?.find(
        (candidate) => candidate.title.trim().toLowerCase() === normalizedTarget
      );

      if (arc) {
        enriched.targetState = capitalize(arc.status);
        if (arc.horizon?.trim()) {
          enriched.targetHorizon = arc.horizon.trim();
        }
        enriched.reasonDetail =
          metadata.reasonDetail
          ?? `This draft appears to be interacting with a tracked arc that is still marked ${arc.status}.`;
      }
    }
  }

  if (metadata.targetSection === "notes") {
    const relevantPlanningNote = findRelevantPlanningNote(
      notesContent,
      metadata.targetLabel,
      metadata.reasonType === "cta_drift"
        ? ["cta", "call to action", "close", "ending", "sign-off"]
        : metadata.reasonType === "segment_drift"
          ? ["segment", "recurring", "section", "format", "series"]
          : []
    );

    if (metadata.reasonType === "cta_drift" && relevantPlanningNote) {
      enriched.targetState = relevantPlanningNote;
      enriched.reasonDetail =
        metadata.reasonDetail
        ?? `This issue ending appears to drift from the stored CTA or close pattern: ${relevantPlanningNote}`;
    }

    if (metadata.reasonType === "segment_drift" && relevantPlanningNote) {
      enriched.targetState = relevantPlanningNote;
      enriched.reasonDetail =
        metadata.reasonDetail
        ?? `This issue appears to skip or break a recurring section or editorial pattern recorded in planning notes: ${relevantPlanningNote}`;
    }
  }

  return enriched;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatStyleGuideSummary(
  styleGuide: BibleStyleGuideContent | undefined
) {
  if (!styleGuide) {
    return "";
  }

  return [
    styleGuide.proseStyle?.trim() ? `Prose: ${styleGuide.proseStyle.trim()}` : "",
    styleGuide.dialogueStyle?.trim()
      ? `References and quotes: ${styleGuide.dialogueStyle.trim()}`
      : "",
    styleGuide.pacing?.trim() ? `Pacing: ${styleGuide.pacing.trim()}` : "",
    styleGuide.pov?.trim() ? `Perspective: ${styleGuide.pov.trim()}` : "",
    styleGuide.tense?.trim() ? `Tense: ${styleGuide.tense.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function findRelevantPlanningNote(
  notes: BibleNotesContent | undefined,
  targetLabel: string | undefined,
  keywords: string[]
) {
  const lines = (notes?.text ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "";
  }

  const normalizedTarget = targetLabel?.trim().toLowerCase();
  if (normalizedTarget) {
    const matchedLine = lines.find((line) =>
      line.toLowerCase().includes(normalizedTarget)
    );

    if (matchedLine) {
      return matchedLine;
    }
  }

  const matchedKeywordLine = lines.find((line) => {
    const normalizedLine = line.toLowerCase();
    return keywords.some((keyword) => normalizedLine.includes(keyword));
  });

  return matchedKeywordLine ?? lines[0];
}
