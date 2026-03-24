import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateAndFetchBible } from "../shared";
import { buildDescribePrompt } from "../../../lib/prompts/craft";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const result = await authenticateAndFetchBible(req);

    if ("error" in result) {
      return result.error;
    }

    const { selectedText, context, bibleContext } = result;

    const prompt = buildDescribePrompt(selectedText, context, bibleContext);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ result: [] }, { status: 200 });
    }

    let parsed: string[];
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ result: [] }, { status: 200 });
    }

    return NextResponse.json({ result: parsed }, { status: 200 });
  } catch (err) {
    console.error("Describe error:", err);
    const message = err instanceof Error ? err.message : "Describe failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
