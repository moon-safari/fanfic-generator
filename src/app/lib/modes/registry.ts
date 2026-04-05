// src/app/lib/modes/registry.ts
import type { ProjectMode } from "../../types/story";
import type { ModeConfig } from "./types";
import { fictionMode } from "./fiction";
import { newsletterMode } from "./newsletter";

const MODE_REGISTRY: Record<ProjectMode, ModeConfig> = {
  fiction: fictionMode,
  newsletter: newsletterMode,
};

export function getModeConfig(mode: ProjectMode): ModeConfig {
  return MODE_REGISTRY[mode] ?? MODE_REGISTRY.fiction;
}

export type { ModeConfig } from "./types";
