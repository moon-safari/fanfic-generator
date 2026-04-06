import type { SupabaseClient } from "@supabase/supabase-js";
import { getModeConfig } from "./modes/registry.ts";
import type {
  BibleNotesContent,
  BibleOutlineContent,
} from "../types/bible.ts";
import type { ProjectMode } from "../types/story.ts";

export async function resolvePlanningPromptContext(
  supabase: SupabaseClient,
  storyId: string,
  unitNumber: number,
  projectMode: ProjectMode
): Promise<string> {
  const { data, error } = await supabase
    .from("story_bibles")
    .select("section_type, content")
    .eq("story_id", storyId)
    .in("section_type", ["outline", "notes"]);

  if (error) {
    console.error("Failed to resolve planning prompt context:", error);
    return "";
  }

  const outline = (data ?? []).find(
    (section) => section.section_type === "outline"
  )?.content as BibleOutlineContent | undefined;
  const notes = (data ?? []).find(
    (section) => section.section_type === "notes"
  )?.content as BibleNotesContent | undefined;

  return buildPlanningPromptContext({
    outline,
    notes,
    unitNumber,
    projectMode,
  });
}

export function buildPlanningPromptContext({
  outline,
  notes,
  unitNumber,
  projectMode,
}: {
  outline?: BibleOutlineContent | null;
  notes?: BibleNotesContent | null;
  unitNumber: number;
  projectMode: ProjectMode;
}) {
  return getModeConfig(projectMode).buildPlanningPrompt({
    outline,
    notes,
    unitNumber,
    projectMode,
  });
}
