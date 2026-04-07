"use client";

import type { ReactNode } from "react";
import { ChevronDown, FileText } from "lucide-react";
import {
  DEFAULT_NON_FICTION_MODE_CONFIG,
  labelNonFictionPieceEngine,
  NON_FICTION_PIECE_ENGINES,
} from "../../lib/nonFictionModeConfig";
import type { NonFictionModeConfig } from "../../types/story";

interface NonFictionSetupPanelProps {
  nonFictionConfigDraft: NonFictionModeConfig;
  savingNonFictionConfig: boolean;
  nonFictionConfigError: string | null;
  showSetup: boolean;
  onToggleSetup: () => void;
  onConfigChange: (draft: NonFictionModeConfig) => void;
}

export default function NonFictionSetupPanel({
  nonFictionConfigDraft,
  savingNonFictionConfig,
  nonFictionConfigError,
  showSetup,
  onToggleSetup,
  onConfigChange,
}: NonFictionSetupPanelProps) {
  const selectedPieceEngine =
    nonFictionConfigDraft.pieceEngine
    ?? DEFAULT_NON_FICTION_MODE_CONFIG.pieceEngine;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Non-fiction setup</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Control how future sections generate and how claims and evidence are
            framed. Existing sections stay untouched.
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
          <div className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-orange-500/10 p-2 text-orange-200">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  Future generation defaults
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Non-fiction v1 always drafts as hybrid section drafts. The
                  piece engine shapes article-versus-essay pressure while
                  keeping sources and claims first-class memory.
                </p>
              </div>
            </div>
          </div>

          <OptionGroup
            label="Piece engine"
            helper="This shapes argument cadence and section voice for future sections."
          >
            {NON_FICTION_PIECE_ENGINES.map((option) => (
              <ToggleButton
                key={option}
                active={selectedPieceEngine === option}
                onClick={() =>
                  onConfigChange({
                    ...nonFictionConfigDraft,
                    pieceEngine: option,
                  })
                }
              >
                {labelNonFictionPieceEngine(option)}
              </ToggleButton>
            ))}
          </OptionGroup>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full border px-2.5 py-1 ${
                savingNonFictionConfig
                  ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                  : "border-zinc-700 bg-zinc-950/80 text-zinc-300"
              }`}
            >
              {savingNonFictionConfig
                ? "Saving non-fiction setup..."
                : "Non-fiction setup saved automatically"}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-zinc-300">
              Drafting: Hybrid section draft
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-zinc-300">
              Format: Article draft
            </span>
          </div>

          {nonFictionConfigError && (
            <div className="rounded-2xl border border-red-700 bg-red-900/40 px-3 py-3 text-sm text-red-200">
              {nonFictionConfigError}
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
          ? "border-orange-500 bg-orange-500/15 text-white"
          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
