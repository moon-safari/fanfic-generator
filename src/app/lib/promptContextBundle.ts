import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoryContextSource } from "../types/memory";
import type { ProjectMode, StoryModeConfig } from "../types/story";

export interface StoryPromptMetaLike {
  title: string;
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
}

export interface PromptContextBundleStoryContext {
  text: string;
  source: StoryContextSource;
}

export interface PromptContextBundleResult {
  storyContext: PromptContextBundleStoryContext;
  planningContext: string;
  projectMode: ProjectMode;
  resolvedThroughUnitNumber: number;
  planningUnitNumber: number;
}

export interface ResolvePromptContextBundleOptions {
  resolvedThroughUnitNumber: number;
  planningUnitNumber?: number;
}

export interface PromptContextBundleDeps {
  fetchStoryPromptMeta: (
    supabase: SupabaseClient,
    storyId: string
  ) => Promise<StoryPromptMetaLike | null>;
  resolveStoryContext: (
    supabase: SupabaseClient,
    storyId: string,
    resolvedThroughUnitNumber: number,
    storyMeta: StoryPromptMetaLike | null
  ) => Promise<PromptContextBundleStoryContext>;
  resolvePlanningContext: (
    supabase: SupabaseClient,
    storyId: string,
    planningUnitNumber: number,
    projectMode: ProjectMode
  ) => Promise<string>;
}

export async function resolvePromptContextBundle(
  supabase: SupabaseClient,
  storyId: string,
  options: ResolvePromptContextBundleOptions,
  deps: PromptContextBundleDeps
): Promise<PromptContextBundleResult> {
  const resolvedThroughUnitNumber = Math.max(1, options.resolvedThroughUnitNumber);
  const planningUnitNumber = Math.max(
    1,
    options.planningUnitNumber ?? resolvedThroughUnitNumber + 1
  );
  const storyMeta = await deps.fetchStoryPromptMeta(supabase, storyId);
  const projectMode = storyMeta?.projectMode ?? "fiction";
  const [storyContext, planningContext] = await Promise.all([
    deps.resolveStoryContext(
      supabase,
      storyId,
      resolvedThroughUnitNumber,
      storyMeta
    ),
    deps.resolvePlanningContext(
      supabase,
      storyId,
      planningUnitNumber,
      projectMode
    ),
  ]);

  return {
    storyContext,
    planningContext,
    projectMode,
    resolvedThroughUnitNumber,
    planningUnitNumber,
  };
}
