"use client";

import type { ReactNode } from "react";
import { ChevronDown, Gamepad2 } from "lucide-react";
import {
  DEFAULT_GAME_WRITING_MODE_CONFIG,
  GAME_WRITING_QUEST_ENGINES,
  labelGameWritingQuestEngine,
} from "../../lib/gameWritingModeConfig";
import type { GameWritingModeConfig } from "../../types/story";

interface GameWritingSetupPanelProps {
  gameWritingConfigDraft: GameWritingModeConfig;
  savingGameWritingConfig: boolean;
  gameWritingConfigError: string | null;
  showSetup: boolean;
  onToggleSetup: () => void;
  onConfigChange: (draft: GameWritingModeConfig) => void;
}

export default function GameWritingSetupPanel({
  gameWritingConfigDraft,
  savingGameWritingConfig,
  gameWritingConfigError,
  showSetup,
  onToggleSetup,
  onConfigChange,
}: GameWritingSetupPanelProps) {
  const selectedQuestEngine =
    gameWritingConfigDraft.questEngine
    ?? DEFAULT_GAME_WRITING_MODE_CONFIG.questEngine;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Game writing setup</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Control how future quests generate and how scope pressure is framed.
            Existing quests stay untouched.
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
          <div className="rounded-3xl border border-sky-500/20 bg-sky-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-sky-500/10 p-2 text-sky-200">
                <Gamepad2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  Future generation defaults
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Game-writing v1 always drafts as hybrid quest briefs. The
                  quest engine shapes scope, consequence pressure, and payoff
                  horizon.
                </p>
              </div>
            </div>
          </div>

          <OptionGroup
            label="Quest engine"
            helper="This shapes scope, optionality, and payoff pressure for future quests."
          >
            {GAME_WRITING_QUEST_ENGINES.map((option) => (
              <ToggleButton
                key={option}
                active={selectedQuestEngine === option}
                onClick={() =>
                  onConfigChange({
                    ...gameWritingConfigDraft,
                    questEngine: option,
                  })
                }
              >
                {labelGameWritingQuestEngine(option)}
              </ToggleButton>
            ))}
          </OptionGroup>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full border px-2.5 py-1 ${
                savingGameWritingConfig
                  ? "border-sky-500/40 bg-sky-500/10 text-sky-200"
                  : "border-zinc-700 bg-zinc-950/80 text-zinc-300"
              }`}
            >
              {savingGameWritingConfig
                ? "Saving game-writing setup..."
                : "Game-writing setup saved automatically"}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-zinc-300">
              Drafting: Hybrid quest brief
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-zinc-300">
              Format: Quest brief
            </span>
          </div>

          {gameWritingConfigError && (
            <div className="rounded-2xl border border-red-700 bg-red-900/40 px-3 py-3 text-sm text-red-200">
              {gameWritingConfigError}
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
          ? "border-sky-500 bg-sky-500/15 text-white"
          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
