import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateAndFetchStoryContext } from "../shared";
import { buildBrainstormPrompt } from "../../../lib/prompts/craft";
import { saveCraftHistory } from "../../../lib/supabase/craftHistory";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateAndFetchStoryContext(req);

    if ("error" in authResult) {
      return authResult.error;
    }

    const { selectedText, context, storyContext, userId, storyId, chapterNumber } =
      authResult;

    const prompt = buildBrainstormPrompt(selectedText, context, storyContext);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ result: [] }, { status: 200 });
    }

    let parsed: { title: string; description: string; prose: string }[];
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ result: [] }, { status: 200 });
    }

    const ideas = parsed.map((item) => ({
      title: item.title || "",
      description: item.description || "",
      prose: item.prose || "",
    }));

    // Save to history (non-blocking)
    saveCraftHistory({
      storyId,
      chapterNumber,
      toolType: "brainstorm",
      direction: null,
      selectedText,
      result: { type: "brainstorm", ideas },
      userId,
    }).catch(() => {});

    return NextResponse.json({ result: ideas }, { status: 200 });
  } catch (err) {
    console.error("Brainstorm error:", err);
    const message = err instanceof Error ? err.message : "Brainstorm failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
