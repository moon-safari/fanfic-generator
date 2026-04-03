import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getIssuePackageSupportingArtifacts } from "../../../lib/adaptationArtifacts";
import {
  getAdaptationChainPreset,
  getAdaptationPreset,
  isAdaptationChainId,
  isAdaptationChainIdEnabled,
} from "../../../lib/adaptations";
import {
  buildChapterAdaptationPrompt,
  buildChainedAdaptationPrompt,
  getAdaptationMaxTokens,
} from "../../../lib/prompts/adaptation";
import { upsertAdaptationOutput } from "../../../lib/supabase/adaptations";
import type {
  AdaptationChainResult,
  ChapterAdaptationResult,
} from "../../../types/adaptation";
import {
  type AdaptationSourceData,
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
      chainId?: string;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { storyId, chapterId, chainId } = body;

    if (!storyId || !chapterId || !chainId) {
      return NextResponse.json(
        { error: "storyId, chapterId, and chainId are required" },
        { status: 400 }
      );
    }

    if (!isAdaptationChainId(chainId)) {
      return NextResponse.json(
        { error: "Unsupported adaptation chain" },
        { status: 400 }
      );
    }
    const chain = getAdaptationChainPreset(chainId);

    const source = await authenticateAndLoadAdaptationSource(storyId, chapterId);
    if (isAdaptationRouteError(source)) {
      return source.error;
    }

    if (!isAdaptationChainIdEnabled(chainId, source.story.projectMode)) {
      return NextResponse.json(
        { error: "This workflow is not available for the current project mode" },
        { status: 400 }
      );
    }

    const results: ChapterAdaptationResult[] = [];
    const supportingArtifacts = getIssuePackageSupportingArtifacts(
      source.existingOutputs
    );
    let previousArtifact:
      | {
          label: string;
          content: string;
        }
      | null = null;

    for (const step of chain.steps) {
      let prompt: string | null;

      if (step.source === "previous") {
        prompt = previousArtifact
          ? buildChainedAdaptationPrompt({
              outputType: step.outputType,
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
              sourceLabel: previousArtifact.label,
              sourceContent: previousArtifact.content,
              storyContext: source.storyContext.text,
              planningContext: source.planningContext,
              existingOutputs: source.existingOutputs,
              packageSelection: source.packageSelection,
              workflowLabel: chain.label,
            })
          : null;
      } else {
        prompt = buildChapterAdaptationPrompt({
          outputType: step.outputType,
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
          workflowLabel: chain.label,
          supportingArtifacts:
            step.outputType === "issue_send_checklist"
              ? supportingArtifacts
              : undefined,
        });
      }

      if (!prompt) {
        return NextResponse.json(
          { error: "Workflow chain is missing a required source artifact" },
          { status: 400 }
        );
      }

      const message: Awaited<ReturnType<typeof anthropic.messages.create>> =
        await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: getAdaptationMaxTokens(step.outputType),
        messages: [{ role: "user", content: prompt }],
      });

      const content: string =
        message.content[0]?.type === "text"
          ? message.content[0].text.trim()
          : "";

      if (!content) {
        return NextResponse.json(
          {
            error: `Chain failed while generating ${getAdaptationPreset(step.outputType).label.toLowerCase()}`,
          },
          { status: 502 }
        );
      }

      const result = await persistChainedOutput(
        source,
        step.outputType,
        content
      );

      results.push(result);
      source.existingOutputs = [
        ...source.existingOutputs.filter(
          (existing) => existing.outputType !== step.outputType
        ),
        result,
      ];
      previousArtifact = {
        label: getAdaptationPreset(step.outputType).label,
        content,
      };
      if (step.outputType !== "issue_send_checklist") {
        supportingArtifacts.push({
          label: getAdaptationPreset(step.outputType).label,
          content,
        });
      }
    }

    const response: AdaptationChainResult = {
      chainId,
      results,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Adaptation chain error:", error);
    const message =
      error instanceof Error ? error.message : "Adaptation chain failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function persistChainedOutput(
  source: AdaptationSourceData,
  outputType: ChapterAdaptationResult["outputType"],
  content: string
): Promise<ChapterAdaptationResult> {
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
    console.error(`Failed to persist ${outputType}:`, saveError);
  }

  return result;
}
