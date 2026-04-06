"use client";

import type { ReactNode } from "react";
import { ChevronDown, PanelsTopLeft } from "lucide-react";
import {
  COMICS_SERIES_ENGINES,
  DEFAULT_COMICS_MODE_CONFIG,
  labelComicsSeriesEngine,
} from "../../lib/comicsModeConfig";
import type { ComicsModeConfig } from "../../types/story";

interface ComicsSetupPanelProps {
  comicsConfigDraft: ComicsModeConfig;
  savingComicsConfig: boolean;
  comicsConfigError: string | null;
  showSetup: boolean;
  onToggleSetup: () => void;
  onConfigChange: (draft: ComicsModeConfig) => void;
}

export default function ComicsSetupPanel({
  comicsConfigDraft,
  savingComicsConfig,
  comicsConfigError,
  showSetup,
  onToggleSetup,
  onConfigChange,
}: ComicsSetupPanelProps) {
  const selectedSeriesEngine =
    comicsConfigDraft.seriesEngine ?? DEFAULT_COMICS_MODE_CONFIG.seriesEngine;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Comics setup</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Control how future pages generate and how pacing scope is framed.
            Existing pages stay untouched.
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
          <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-cyan-500/10 p-2 text-cyan-200">
                <PanelsTopLeft className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  Future generation defaults
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Comics v1 always drafts as comic script pages. The series
                  engine shapes pacing horizon, reveal timing, and payoff scale.
                </p>
              </div>
            </div>
          </div>

          <OptionGroup
            label="Series engine"
            helper="This shapes pacing pressure and payoff horizon for future pages."
          >
            {COMICS_SERIES_ENGINES.map((option) => (
              <ToggleButton
                key={option}
                active={selectedSeriesEngine === option}
                onClick={() =>
                  onConfigChange({
                    ...comicsConfigDraft,
                    seriesEngine: option,
                  })
                }
              >
                {labelComicsSeriesEngine(option)}
              </ToggleButton>
            ))}
          </OptionGroup>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full border px-2.5 py-1 ${
                savingComicsConfig
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                  : "border-zinc-700 bg-zinc-950/80 text-zinc-300"
              }`}
            >
              {savingComicsConfig
                ? "Saving comics setup..."
                : "Comics setup saved automatically"}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-zinc-300">
              Drafting: Comic script pages
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-zinc-300">
              Format: Comic script
            </span>
          </div>

          {comicsConfigError && (
            <div className="rounded-2xl border border-red-700 bg-red-900/40 px-3 py-3 text-sm text-red-200">
              {comicsConfigError}
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
          ? "border-cyan-500 bg-cyan-500/15 text-white"
          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
