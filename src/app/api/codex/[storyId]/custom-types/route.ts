import { NextRequest, NextResponse } from "next/server";
import { insertCodexCustomType } from "../../../../lib/supabase/codex";
import {
  authenticateCodexStory,
  isRouteError,
  isUniqueViolation,
  parseSuggestedFields,
} from "../../shared";
import type { CreateCodexCustomTypeInput } from "../../../../types/codex";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const auth = await authenticateCodexStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const body = (await req.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (body.color !== undefined && typeof body.color !== "string") {
      return NextResponse.json({ error: "color must be a string" }, { status: 400 });
    }

    if (body.icon !== undefined && typeof body.icon !== "string") {
      return NextResponse.json({ error: "icon must be a string" }, { status: 400 });
    }

    const suggestedFields =
      body.suggestedFields === undefined
        ? undefined
        : parseSuggestedFields(body.suggestedFields);
    if (body.suggestedFields !== undefined && suggestedFields === null) {
      return NextResponse.json(
        {
          error:
            "suggestedFields must be an array of { key, placeholder } objects",
        },
        { status: 400 }
      );
    }

    const input: CreateCodexCustomTypeInput = {
      name,
      color: typeof body.color === "string" ? body.color : undefined,
      icon: typeof body.icon === "string" ? body.icon : undefined,
      suggestedFields: suggestedFields ?? undefined,
    };

    const customType = await insertCodexCustomType(
      auth.supabase,
      storyId,
      input
    );

    if (!customType) {
      return NextResponse.json(
        { error: "Failed to create custom type" },
        { status: 500 }
      );
    }

    return NextResponse.json({ customType }, { status: 201 });
  } catch (err) {
    console.error("Codex custom type create error:", err);

    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "A custom type with that name already exists" },
        { status: 409 }
      );
    }

    const message =
      err instanceof Error ? err.message : "Failed to create custom type";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
