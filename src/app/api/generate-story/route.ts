import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { StoryFormData } from "../../types/story";
import { buildChapter1Prompt } from "../../lib/prompts";
import {
  isComicsFormData,
  isNewsletterFormData,
  isScreenplayFormData,
} from "../../lib/projectMode";
import { createServerSupabase } from "../../lib/supabase/server";
import { sseEvent } from "../../lib/stream";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: StoryFormData;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (isNewsletterFormData(body)) {
    if (
      body.title.trim().length < 2
      || body.newsletterTopic.trim().length < 3
      || body.audience.trim().length < 3
      || body.issueAngle.trim().length < 8
      || !Array.isArray(body.tone)
      || body.tone.length < 1
    ) {
      return NextResponse.json(
        { error: "Missing required newsletter fields" },
        { status: 400 }
      );
    }
  } else if (isScreenplayFormData(body)) {
    if (
      body.title.trim().length < 2
      || !Array.isArray(body.tone)
      || body.tone.length < 1
      || (body.draftingPreference !== "script_pages"
        && body.draftingPreference !== "beat_draft")
    ) {
      return NextResponse.json(
        { error: "Missing required screenplay fields" },
        { status: 400 }
      );
    }
  } else if (isComicsFormData(body)) {
    if (
      body.title.trim().length < 2
      || !Array.isArray(body.tone)
      || body.tone.length < 1
    ) {
      return NextResponse.json(
        { error: "Missing required comics fields" },
        { status: 400 }
      );
    }
  } else if (
    !body.characters
    || !Array.isArray(body.characters)
    || body.characters.filter((c: string) => c.trim().length > 0).length < 2
    || !body.tone
    || !Array.isArray(body.tone)
    || body.tone.length < 1
    || !body.rating
    || !body.relationshipType
  ) {
    return NextResponse.json(
      { error: "Missing required fiction fields" },
      { status: 400 }
    );
  }

  const prompt = buildChapter1Prompt(body);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        });

        let titleBuffer = "";
        let titleEmitted = false;

        anthropicStream.on("text", (text) => {
          if (!titleEmitted) {
            titleBuffer += text;
            const newlineIdx = titleBuffer.indexOf("\n");
            if (newlineIdx !== -1) {
              // Extract title from "Title: ..." line
              const titleLine = titleBuffer.substring(0, newlineIdx);
              const titleMatch = titleLine.match(/^Title:\s*(.+?)$/);
              const title = titleMatch ? titleMatch[1].trim() : "Untitled Story";
              controller.enqueue(encoder.encode(sseEvent("title", title)));
              titleEmitted = true;

              // Emit any remaining text after the title line
              const remainder = titleBuffer.substring(newlineIdx + 1).trimStart();
              if (remainder) {
                controller.enqueue(encoder.encode(sseEvent("delta", remainder)));
              }
            }
          } else {
            controller.enqueue(encoder.encode(sseEvent("delta", text)));
          }
        });

        anthropicStream.on("error", (err) => {
          const message = err instanceof Error ? err.message : "Generation failed";
          controller.enqueue(encoder.encode(sseEvent("error", message)));
          controller.close();
        });

        // Wait for the stream to finish
        await anthropicStream.finalMessage();
        controller.enqueue(encoder.encode(sseEvent("done", "{}")));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        controller.enqueue(encoder.encode(sseEvent("error", message)));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
