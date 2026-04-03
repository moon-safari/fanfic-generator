import { NextResponse } from "next/server";
import {
  PLANNING_ARTIFACT_TYPES,
  toAdaptationArtifact,
  toPlanningArtifact,
} from "../../../lib/artifacts";
import { fetchAdaptationOutputsForStory } from "../../../lib/supabase/adaptations";
import { createServerSupabase } from "../../../lib/supabase/server";
import type { BibleSection, BibleSectionContent, BibleSectionType } from "../../../types/bible";
import type { ProjectMode } from "../../../types/story";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, project_mode")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const projectMode = (story.project_mode as ProjectMode | undefined) ?? "fiction";
    const adaptationOutputs = await fetchAdaptationOutputsForStory(
      supabase,
      storyId
    );
    const { data: planningSections, error: planningError } = await supabase
      .from("story_bibles")
      .select("*")
      .eq("story_id", storyId)
      .in("section_type", PLANNING_ARTIFACT_TYPES);

    if (planningError) {
      return NextResponse.json(
        { error: "Failed to fetch planning artifacts" },
        { status: 500 }
      );
    }

    const sectionMap = new Map(
      ((planningSections ?? []) as Array<{
        id: string;
        story_id: string;
        section_type: string;
        content: BibleSectionContent;
        created_at: string;
        updated_at: string;
      }>).map((row) => [
        row.section_type,
        {
          id: row.id,
          storyId: row.story_id,
          sectionType: row.section_type as BibleSectionType,
          content: row.content,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        } satisfies BibleSection,
      ])
    );

    const planningArtifacts = PLANNING_ARTIFACT_TYPES.map((sectionType) =>
      toPlanningArtifact(
        storyId,
        sectionMap.get(sectionType) ?? null,
        sectionType,
        projectMode
      )
    );

    const artifacts = [
      ...adaptationOutputs.map((output) => toAdaptationArtifact(output, projectMode)),
      ...planningArtifacts,
    ]
      .sort((left, right) => {
        const leftTime = left.updatedAt ? Date.parse(left.updatedAt) : 0;
        const rightTime = right.updatedAt ? Date.parse(right.updatedAt) : 0;
        return rightTime - leftTime;
      });

    return NextResponse.json({ artifacts }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch artifacts:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch artifacts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
