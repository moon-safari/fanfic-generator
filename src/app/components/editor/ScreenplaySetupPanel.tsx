"use client";

import type { ReactNode } from "react";
import { ChevronDown, Clapperboard } from "lucide-react";
import type {
  ScreenplayDraftingPreference,
  ScreenplayModeConfig,
  ScreenplayStoryEngine,
} from "../../types/story";

interface ScreenplaySetupPanelProps {
  screenplayConfigDraft: ScreenplayModeConfig;
  savingScreenplayConfig: boolean;
  screenplayConfigError: string | null;
  showSetup: boolean;
  onToggleSetup: () => void;
  onConfigChange: (draft: ScreenplayModeConfig) => void;
}

const DRAFTING_PREFERENCES: ScreenplayDraftingPreference[] = [
  "script_pages",
  "beat_draft",
];

const STORY_ENGINES: ScreenplayStoryEngine[] = ["feature", "pilot", "short"];

export default function ScreenplaySetupPanel({
  screenplayConfigDraft,
  savingScreenplayConfig,
  screenplayConfigError,
  showSetup,
  onToggleSetup,
  onConfigChange,
}: ScreenplaySetupPanelProps) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Screenplay setup</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Control how future scenes generate and how screenplay exports default.
            Existing scenes stay untouched.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleSetup}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
            showSetup
              ? "border-zinc-600 bg-zinc-900 text-white"
              : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
          }`}
        >
          {showSetup ? "Hide setup" : "Open setup"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${
              showSetup ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {showSetup && (
        <div className="mt-4 space-y-4">
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-500/10 p-2 text-amber-200">
                <Clapperboard className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  Future generation defaults
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Switching this changes future generation behavior and export
                  defaults. It does not rewrite existing scenes.
                </p>
              </div>
            </div>
          </div>

          <OptionGroup
            label="Drafting preference"
            helper="Choose whether the main draft defaults to screenplay pages or a scene-beat draft."
          >
            {DRAFTING_PREFERENCES.map((option) => (
              <ToggleButton
                key={option}
                active={screenplayConfigDraft.draftingPreference === option}
                onClick={() =>
                  onConfigChange({
                    ...screenplayConfigDraft,
                    draftingPreference: option,
                  })
                }
              >
                {labelDraftingPreference(option)}
              </ToggleButton>
            ))}
          </OptionGroup>

          <OptionGroup
            label="Story engine"
            helper="This shapes how the planner and generator frame scope."
          >
            {STORY_ENGINES.map((option) => (
              <ToggleButton
                key={option}
                active={screenplayConfigDraft.storyEngine === option}
                onClick={() =>
                  onConfigChange({
                    ...screenplayConfigDraft,
                    storyEngine: option,
                  })
                }
              >
                {labelStoryEngine(option)}
              </ToggleButton>
            ))}
          </OptionGroup>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full border px-2.5 py-1 ${
                savingScreenplayConfig
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                  : "border-zinc-700 bg-zinc-950/80 text-zinc-300"
              }`}
            >
              {savingScreenplayConfig ? "Saving screenplay setup..." : "Screenplay setup saved automatically"}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-zinc-300">
              Format: Fountain
            </span>
          </div>

          {screenplayConfigError && (
            <div className="rounded-2xl border border-red-700 bg-red-900/40 px-3 py-3 text-sm text-red-200">
              {screenplayConfigError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OptionGroup({
  label,
  helper,
  children,
}: {
  label: string;
  helper: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{helper}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-amber-500 bg-amber-500/15 text-white"
          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function labelDraftingPreference(value: ScreenplayDraftingPreference) {
  return value === "script_pages" ? "Script pages" : "Beat draft";
}

function labelStoryEngine(value: ScreenplayStoryEngine) {
  switch (value) {
    case "pilot":
      return "Pilot";
    case "short":
      return "Short";
    default:
      return "Feature";
  }
}
