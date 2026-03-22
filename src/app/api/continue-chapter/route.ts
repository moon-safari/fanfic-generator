import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Story } from "../../types/story";
import { buildContinuationPrompt } from "../../lib/prompts";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body: { story: Story } = await req.json();
    const { story } = body;

    if (!story || !story.chapters || story.chapters.length === 0) {
      return NextResponse.json(
        { error: "Story with at least one chapter is required" },
        { status: 400 }
      );
    }

    const chapterNum = story.chapters.length + 1;
    const prompt = buildContinuationPrompt(story, chapterNum);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const chapter =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    return NextResponse.json({ chapter }, { status: 200 });
  } catch (err) {
    console.error("Continue chapter error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
