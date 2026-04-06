import { NextResponse } from "next/server";
import { resolvePromptContextBundle } from "../../lib/storyContext";
import { fetchNewsletterIssuePackageSelection } from "../../lib/supabase/newsletterIssuePackages";
import { fetchAdaptationOutputs } from "../../lib/supabase/adaptations";
import { createServerSupabase } from "../../lib/supabase/server";
import type { ChapterAdaptationResult } from "../../types/adaptation";
import type { NewsletterIssuePackageSelectionValues } from "../../types/newsletter";
import type { ProjectMode, StoryModeConfig } from "../../types/story";

type RouteError = { error: NextResponse };

export interface AdaptationSourceData {
  supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  storyId: string;
  story: {
    title: string;
    projectMode: ProjectMode;
    modeConfig?: StoryModeConfig;
    fandom: string;
    customFandom?: string;
    characters: string[];
    tone: string[];
    tropes: string[];
  };
  chapter: {
    id: string;
    content: string;
    summary?: string;
    chapterNumber: number;
  };
  storyContext: {
    text: string;
    source: "memory" | "story_bible" | "none";
  };
  planningContext: string;
  existingOutputs: ChapterAdaptationResult[];
  packageSelection: NewsletterIssuePackageSelectionValues | null;
}

export async function authenticateAndLoadAdaptationSource(
  storyId: string,
  chapterId: string
): Promise<AdaptationSourceData | RouteError> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("id, title, project_mode, mode_config, fandom, custom_fandom, characters, tone, tropes")
    .eq("id", storyId)
    .eq("user_id", user.id)
    .single();

  if (storyError || !story) {
    return {
      error: NextResponse.json({ error: "Story not found" }, { status: 404 }),
    };
  }

  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("id, story_id, content, summary, chapter_number")
    .eq("id", chapterId)
    .eq("story_id", storyId)
    .single();

  if (chapterError || !chapter) {
    return {
      error: NextResponse.json({ error: "Chapter not found" }, { status: 404 }),
    };
  }

  const chapterContent = (chapter.content as string | null)?.trim() ?? "";
  if (!chapterContent) {
    return {
      error: NextResponse.json(
        { error: "Chapter content is required before adapting it" },
        { status: 400 }
      ),
    };
  }

  const chapterNumber = Math.max(1, chapter.chapter_number as number);
  const { storyContext, planningContext } = await resolvePromptContextBundle(
    supabase,
    storyId,
    {
      resolvedThroughUnitNumber: chapterNumber,
      planningUnitNumber: chapterNumber,
    }
  );
  const projectMode =
    (story.project_mode as ProjectMode | undefined) ?? "fiction";
  const existingOutputs = await fetchAdaptationOutputs(supabase, storyId, chapterId);
  const packageSelection =
    projectMode === "newsletter"
      ? await fetchNewsletterIssuePackageSelection(supabase, storyId, chapterId)
      : null;

  return {
    supabase,
    storyId,
    story: {
      title: story.title as string,
      projectMode,
      modeConfig: (story.mode_config as StoryModeConfig | undefined) ?? undefined,
      fandom: story.fandom as string,
      customFandom: (story.custom_fandom as string | null) ?? undefined,
      characters: (story.characters as string[] | null) ?? [],
      tone: (story.tone as string[] | null) ?? [],
      tropes: (story.tropes as string[] | null) ?? [],
    },
    chapter: {
      id: chapterId,
      content: chapterContent,
      summary: (chapter.summary as string | null) ?? undefined,
      chapterNumber,
    },
    storyContext,
    planningContext,
    existingOutputs,
    packageSelection: packageSelection
      ? {
          subjectLine: packageSelection.subjectLine,
          deck: packageSelection.deck,
          hook: packageSelection.hook,
          cta: packageSelection.cta,
          sectionPackage: packageSelection.sectionPackage,
        }
      : null,
  };
}

export function isAdaptationRouteError(
  value: AdaptationSourceData | RouteError
): value is RouteError {
  return "error" in value;
}
