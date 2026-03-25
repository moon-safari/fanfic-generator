import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateAndFetchBible } from "../shared";
import { buildExpandPrompt } from "../../../lib/prompts/craft";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const result = await authenticateAndFetchBible(req);

    if ("error" in result) {
      return result.error;
    }

    const { selectedText, context, bibleContext, userId, storyId, chapterNumber } = result;

    const prompt = buildExpandPrompt(selectedText, context, bibleContext);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Save to history (non-blocking)
    const { saveCraftHistory } = await import("../../../lib/supabase/craftHistory");
    saveCraftHistory({
      storyId,
      chapterNumber,
      toolType: "expand",
      direction: null,
      selectedText,
      result: { type: "expand", text: text.trim() },
      userId,
    }).catch(() => {});

    return NextResponse.json({ result: text.trim() }, { status: 200 });
  } catch (err) {
    console.error("Expand error:", err);
    const message = err instanceof Error ? err.message : "Expand failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
