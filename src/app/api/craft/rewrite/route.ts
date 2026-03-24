import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateAndFetchBible } from "../shared";
import { buildRewritePrompt } from "../../../lib/prompts/craft";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const result = await authenticateAndFetchBible(req);

    if ("error" in result) {
      return result.error;
    }

    const { selectedText, context, direction, bibleContext } = result;

    const prompt = buildRewritePrompt(selectedText, direction, context, bibleContext);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ result: text.trim() }, { status: 200 });
  } catch (err) {
    console.error("Rewrite error:", err);
    const message = err instanceof Error ? err.message : "Rewrite failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
