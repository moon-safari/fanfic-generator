import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateAndFetchBible } from "../shared";
import { buildDescribePrompt } from "../../../lib/prompts/craft";
import { saveCraftHistory } from "../../../lib/supabase/craftHistory";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateAndFetchBible(req);

    if ("error" in authResult) {
      return authResult.error;
    }

    const { selectedText, context, bibleContext, userId, storyId, chapterNumber } = authResult;

    const prompt = buildDescribePrompt(selectedText, context, bibleContext);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON object from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { result: { blend: "", senses: [] } },
        { status: 200 }
      );
    }

    let parsed: { blend: string; senses: { type: string; text: string }[] };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { result: { blend: "", senses: [] } },
        { status: 200 }
      );
    }

    const describeResult = {
      blend: parsed.blend || "",
      senses: (parsed.senses || []).map((s) => ({
        type: s.type as "sight" | "smell" | "sound" | "touch" | "taste",
        text: s.text,
      })),
    };

    // Save to history (non-blocking)
    saveCraftHistory({
      storyId,
      chapterNumber,
      toolType: "describe",
      direction: null,
      selectedText,
      result: { type: "describe", ...describeResult },
      userId,
    }).catch(() => {});

    return NextResponse.json({ result: describeResult }, { status: 200 });
  } catch (err) {
    console.error("Describe error:", err);
    const message = err instanceof Error ? err.message : "Describe failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
