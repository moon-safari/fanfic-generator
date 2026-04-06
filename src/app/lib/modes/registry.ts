// src/app/lib/modes/registry.ts
import type { ProjectMode } from "../../types/story.ts";
import type { ModeConfig } from "./types.ts";
import { fictionMode } from "./fiction.ts";
import { newsletterMode } from "./newsletter.ts";

const MODE_REGISTRY: Record<ProjectMode, ModeConfig> = {
  fiction: fictionMode,
  newsletter: newsletterMode,
};

export function getModeConfig(mode: ProjectMode): ModeConfig {
  return MODE_REGISTRY[mode] ?? MODE_REGISTRY.fiction;
}

export type { ModeConfig } from "./types.ts";
