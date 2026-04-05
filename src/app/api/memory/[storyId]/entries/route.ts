import { NextRequest, NextResponse } from "next/server";
import { insertMemoryEntry } from "../../../../lib/supabase/memory";
import {
  authenticateMemoryStory,
  isRouteError,
  parseCustomFields,
  parseStringArray,
} from "../../shared";
import type { CreateMemoryEntryInput } from "../../../../types/memory";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const auth = await authenticateMemoryStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const body = (await req.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const entryType =
      typeof body.entryType === "string" ? body.entryType.trim() : "";

    if (!name || !entryType) {
      return NextResponse.json(
        { error: "name and entryType are required" },
        { status: 400 }
      );
    }

    const tags =
      body.tags === undefined ? undefined : parseStringArray(body.tags);
    if (body.tags !== undefined && tags === null) {
      return NextResponse.json({ error: "tags must be a string array" }, { status: 400 });
    }

    const aliases =
      body.aliases === undefined ? undefined : parseStringArray(body.aliases);
    if (body.aliases !== undefined && aliases === null) {
      return NextResponse.json(
        { error: "aliases must be a string array" },
        { status: 400 }
      );
    }

    const customFields =
      body.customFields === undefined
        ? undefined
        : parseCustomFields(body.customFields);
    if (body.customFields !== undefined && customFields === null) {
      return NextResponse.json(
        { error: "customFields must be an array of { key, value } objects" },
        { status: 400 }
      );
    }

    if (
      body.sortOrder !== undefined &&
      (!Number.isInteger(body.sortOrder) || typeof body.sortOrder !== "number")
    ) {
      return NextResponse.json(
        { error: "sortOrder must be an integer" },
        { status: 400 }
      );
    }

    if (
      body.imageUrl !== undefined &&
      body.imageUrl !== null &&
      typeof body.imageUrl !== "string"
    ) {
      return NextResponse.json(
        { error: "imageUrl must be a string or null" },
        { status: 400 }
      );
    }

    if (
      body.color !== undefined &&
      body.color !== null &&
      typeof body.color !== "string"
    ) {
      return NextResponse.json(
        { error: "color must be a string or null" },
        { status: 400 }
      );
    }

    const input: CreateMemoryEntryInput = {
      name,
      entryType,
      description:
        typeof body.description === "string" ? body.description : undefined,
      tags: tags ?? undefined,
      aliases: aliases ?? undefined,
      imageUrl:
        typeof body.imageUrl === "string" || body.imageUrl === null
          ? body.imageUrl
          : undefined,
      color:
        typeof body.color === "string" || body.color === null
          ? body.color
          : undefined,
      customFields: customFields ?? undefined,
      sortOrder:
        typeof body.sortOrder === "number" ? body.sortOrder : undefined,
    };

    const entry = await insertMemoryEntry(auth.supabase, storyId, input);
    if (!entry) {
      return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error("Memory entry create error:", err);
    const message = err instanceof Error ? err.message : "Failed to create entry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
