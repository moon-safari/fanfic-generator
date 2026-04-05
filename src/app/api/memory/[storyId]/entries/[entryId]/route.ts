import { NextRequest, NextResponse } from "next/server";
import { deleteMemoryEntry, updateMemoryEntry } from "../../../../../lib/supabase/memory";
import {
  authenticateMemoryStory,
  getMemoryEntryRecord,
  isRouteError,
  parseCustomFields,
  parseStringArray,
} from "../../../shared";
import type { UpdateMemoryEntryInput } from "../../../../../types/memory";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string; entryId: string }> }
) {
  try {
    const { storyId, entryId } = await params;
    const auth = await authenticateMemoryStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const existingEntry = await getMemoryEntryRecord(auth.supabase, storyId, entryId);
    if (!existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const updates: UpdateMemoryEntryInput = {};

    if ("name" in body) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if ("entryType" in body) {
      if (typeof body.entryType !== "string" || body.entryType.trim().length === 0) {
        return NextResponse.json(
          { error: "entryType must be a non-empty string" },
          { status: 400 }
        );
      }
      updates.entryType = body.entryType.trim();
    }

    if ("description" in body) {
      if (typeof body.description !== "string") {
        return NextResponse.json({ error: "description must be a string" }, { status: 400 });
      }
      updates.description = body.description;
    }

    if ("tags" in body) {
      const tags = parseStringArray(body.tags);
      if (tags === null) {
        return NextResponse.json({ error: "tags must be a string array" }, { status: 400 });
      }
      updates.tags = tags;
    }

    if ("aliases" in body) {
      const aliases = parseStringArray(body.aliases);
      if (aliases === null) {
        return NextResponse.json(
          { error: "aliases must be a string array" },
          { status: 400 }
        );
      }
      updates.aliases = aliases;
    }

    if ("imageUrl" in body) {
      if (body.imageUrl !== null && typeof body.imageUrl !== "string") {
        return NextResponse.json(
          { error: "imageUrl must be a string or null" },
          { status: 400 }
        );
      }
      updates.imageUrl = body.imageUrl as string | null;
    }

    if ("color" in body) {
      if (body.color !== null && typeof body.color !== "string") {
        return NextResponse.json(
          { error: "color must be a string or null" },
          { status: 400 }
        );
      }
      updates.color = body.color as string | null;
    }

    if ("customFields" in body) {
      const customFields = parseCustomFields(body.customFields);
      if (customFields === null) {
        return NextResponse.json(
          { error: "customFields must be an array of { key, value } objects" },
          { status: 400 }
        );
      }
      updates.customFields = customFields;
    }

    if ("sortOrder" in body) {
      if (typeof body.sortOrder !== "number" || !Number.isInteger(body.sortOrder)) {
        return NextResponse.json(
          { error: "sortOrder must be an integer" },
          { status: 400 }
        );
      }
      updates.sortOrder = body.sortOrder;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const entry = await updateMemoryEntry(auth.supabase, storyId, entryId, updates);
    if (!entry) {
      return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
    }

    return NextResponse.json({ entry }, { status: 200 });
  } catch (err) {
    console.error("Memory entry update error:", err);
    const message = err instanceof Error ? err.message : "Failed to update entry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storyId: string; entryId: string }> }
) {
  try {
    const { storyId, entryId } = await params;
    const auth = await authenticateMemoryStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const existingEntry = await getMemoryEntryRecord(auth.supabase, storyId, entryId);
    if (!existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const ok = await deleteMemoryEntry(auth.supabase, storyId, entryId);
    if (!ok) {
      return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Memory entry delete error:", err);
    const message = err instanceof Error ? err.message : "Failed to delete entry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
