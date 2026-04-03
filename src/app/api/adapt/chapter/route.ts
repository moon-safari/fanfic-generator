import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getIssuePackageSupportingArtifacts } from "../../../lib/adaptationArtifacts";
import {
  isAdaptationOutputType,
  isAdaptationOutputTypeEnabled,
} from "../../../lib/adaptations";
import { buildChapterAdaptationPrompt, getAdaptationMaxTokens } from "../../../lib/prompts/adaptation";
import { upsertAdaptationOutput } from "../../../lib/supabase/adaptations";
import type { ChapterAdaptationResult } from "../../../types/adaptation";
import {
  authenticateAndLoadAdaptationSource,
  isAdaptationRouteError,
} from "../shared";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    let body: {
      storyId?: string;
      chapterId?: string;
      outputType?: string;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { storyId, chapterId, outputType } = body;

    if (!storyId || !chapterId || !outputType) {
      return NextResponse.json(
        { error: "storyId, chapterId, and outputType are required" },
        { status: 400 }
      );
    }

    if (!isAdaptationOutputType(outputType)) {
      return NextResponse.json(
        { error: "Unsupported adaptation output type" },
        { status: 400 }
      );
    }

    const source = await authenticateAndLoadAdaptationSource(storyId, chapterId);
    if (isAdaptationRouteError(source)) {
      return source.error;
    }

    if (!isAdaptationOutputTypeEnabled(outputType, source.story.projectMode)) {
      return NextResponse.json(
        { error: "This output is not available for the current project mode" },
        { status: 400 }
      );
    }

    const prompt = buildChapterAdaptationPrompt({
      outputType,
      storyTitle: source.story.title,
      projectMode: source.story.projectMode,
      modeConfig: source.story.modeConfig,
      fandom: source.story.fandom,
      customFandom: source.story.customFandom,
      characters: source.story.characters,
      tone: source.story.tone,
      tropes: source.story.tropes,
      chapterNumber: source.chapter.chapterNumber,
      chapterSummary: source.chapter.summary,
      chapterContent: source.chapter.content,
      storyContext: source.storyContext.text,
      planningContext: source.planningContext,
      existingOutputs: source.existingOutputs,
      packageSelection: source.packageSelection,
      supportingArtifacts:
        outputType === "issue_send_checklist"
          ? getIssuePackageSupportingArtifacts(source.existingOutputs)
          : undefined,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: getAdaptationMaxTokens(outputType),
      messages: [{ role: "user", content: prompt }],
    });

    const content =
      message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

    if (!content) {
      return NextResponse.json(
        { error: "Adaptation returned empty content" },
        { status: 502 }
      );
    }

    const now = new Date().toISOString();
    let result: ChapterAdaptationResult = {
      storyId: source.storyId,
      outputType,
      chapterId: source.chapter.id,
      chapterNumber: source.chapter.chapterNumber,
      content,
      contextSource: source.storyContext.source,
      generatedAt: now,
      updatedAt: now,
      persisted: false,
    };

    try {
      const saved = await upsertAdaptationOutput(source.supabase, {
        storyId: source.storyId,
        chapterId: source.chapter.id,
        chapterNumber: source.chapter.chapterNumber,
        outputType,
        content,
        contextSource: source.storyContext.source,
      });

      if (saved) {
        result = saved;
      }
    } catch (saveError) {
      console.error("Failed to persist adaptation output:", saveError);
    }

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error("Chapter adaptation error:", error);
    const message =
      error instanceof Error ? error.message : "Chapter adaptation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
