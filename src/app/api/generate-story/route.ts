import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { StoryFormData } from "../../types/story";
import { buildChapter1Prompt } from "../../lib/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body: StoryFormData = await req.json();

    if (
      !body.characters ||
      !Array.isArray(body.characters) ||
      body.characters.filter((c: string) => c.trim().length > 0).length < 2 ||
      !body.tone ||
      !Array.isArray(body.tone) ||
      body.tone.length < 1 ||
      !body.rating ||
      !body.relationshipType
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = buildChapter1Prompt(body);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    const titleMatch = text.match(/^Title:\s*(.+?)$/m);
    if (!titleMatch) {
      return NextResponse.json(
        { title: "Untitled Story", chapter: text.trim() },
        { status: 200 }
      );
    }

    const title = titleMatch[1].trim();
    const chapter = text
      .substring(titleMatch.index! + titleMatch[0].length)
      .trim();

    return NextResponse.json({ title, chapter }, { status: 200 });
  } catch (err) {
    console.error("Generate story error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
