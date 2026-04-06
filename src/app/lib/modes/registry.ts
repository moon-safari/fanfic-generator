// src/app/lib/modes/registry.ts
import type { ProjectMode } from "../../types/story.ts";
import type { ModeConfig } from "./types.ts";
import { comicsMode } from "./comics.ts";
import { fictionMode } from "./fiction.ts";
import { gameWritingMode } from "./gameWriting.ts";
import { newsletterMode } from "./newsletter.ts";
import { screenplayMode } from "./screenplay.ts";

const MODE_REGISTRY: Record<ProjectMode, ModeConfig> = {
  comics: comicsMode,
  fiction: fictionMode,
  game_writing: gameWritingMode,
  newsletter: newsletterMode,
  screenplay: screenplayMode,
};

export function getModeConfig(mode: ProjectMode): ModeConfig {
  return MODE_REGISTRY[mode] ?? MODE_REGISTRY.fiction;
}

export type { ModeConfig } from "./types.ts";
