import { createServerSupabase } from "./server";
import { CraftTool, CraftResult, CraftHistoryEntry } from "../../types/craft";

export async function saveCraftHistory(params: {
  storyId: string;
  chapterNumber: number;
  toolType: CraftTool;
  direction: string | null;
  selectedText: string;
  result: CraftResult;
  userId: string;
}): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.from("craft_history").insert({
    story_id: params.storyId,
    chapter_number: params.chapterNumber,
    tool_type: params.toolType,
    direction: params.direction,
    selected_text: params.selectedText,
    result: params.result as unknown as Record<string, unknown>,
    user_id: params.userId,
  });
}

export async function getCraftHistory(
  storyId: string,
  userId: string
): Promise<CraftHistoryEntry[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("craft_history")
    .select("*")
    .eq("story_id", storyId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    storyId: row.story_id as string,
    chapterNumber: row.chapter_number as number,
    toolType: row.tool_type as CraftTool,
    direction: row.direction as string | null,
    selectedText: row.selected_text as string,
    result: row.result as CraftResult,
    status: row.status as "generated" | "inserted" | "dismissed",
    createdAt: row.created_at as string,
  }));
}

export async function updateCraftHistoryStatus(
  id: string,
  status: "inserted" | "dismissed",
  userId: string
): Promise<boolean> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("craft_history")
    .update({ status })
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}
