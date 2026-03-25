import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../../lib/supabase/server";
import { getCraftHistory } from "../../../lib/supabase/craftHistory";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get("storyId");
    if (!storyId) {
      return NextResponse.json({ error: "storyId required" }, { status: 400 });
    }

    const entries = await getCraftHistory(storyId, user.id);
    return NextResponse.json({ entries });
  } catch (err) {
    console.error("History fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
