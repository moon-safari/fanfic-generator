import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase/server";
import { updateCraftHistoryStatus } from "../../../../lib/supabase/craftHistory";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status: "inserted" | "dismissed" };

    if (!status || !["inserted", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const ok = await updateCraftHistoryStatus(id, status, user.id);
    if (!ok) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("History update error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
