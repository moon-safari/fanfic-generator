"use client";

import { ChevronDown, Copy, Download } from "lucide-react";
import { getAdaptationPreset } from "../../lib/adaptations";
import {
  getReadinessStatusClasses,
  getReadinessStatusLabel,
} from "../../lib/artifactsHelpers";
import type { ReadinessGroupSummary } from "../../lib/artifactsHelpers";
import type { AdaptationOutputType } from "../../types/adaptation";
import type {
  NewsletterIssueReadinessCheck,
  NewsletterIssueReadinessReport,
} from "../../types/newsletter";
import type { AdaptationPreset } from "../../lib/adaptations";

interface NewsletterReadinessPanelProps {
  readinessReport: NewsletterIssueReadinessReport | null;
  readinessGroups: ReadinessGroupSummary[];
  readinessLoading: boolean;
  readinessError: string | null;
  visibleReadinessChecks: NewsletterIssueReadinessCheck[];
  hiddenReadyCheckCount: number;
  nextRecommendedPreset: AdaptationPreset | null;
  showReadinessDetails: boolean;
  onToggleReadinessDetails: () => void;
  onRefreshReadiness: () => void;
  onOpenInAdapt: (chapterNumber: number, outputType: AdaptationOutputType) => void;
  currentChapter: number;
  exportingBundle: boolean;
  canExport: boolean;
  showExportOptions: boolean;
  onToggleExportOptions: () => void;
  onExportBundle: (mode: "copy" | "download") => void;
  exportError: string | null;
}

export default function NewsletterReadinessPanel({
  readinessReport,
  readinessGroups,
  readinessLoading,
  readinessError,
  visibleReadinessChecks,
  hiddenReadyCheckCount,
  nextRecommendedPreset,
  showReadinessDetails,
  onToggleReadinessDetails,
  onRefreshReadiness,
  onOpenInAdapt,
  currentChapter,
  exportingBundle,
  canExport,
  showExportOptions,
  onToggleExportOptions,
  onExportBundle,
  exportError,
}: NewsletterReadinessPanelProps) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Pre-send check</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            A quick send/no-send pass for the current issue. It checks your
            saved setup, official package choices, and final export state.
          </p>
        </div>
        <p className="text-xs text-zinc-400">
          Current issue
          {readinessReport
            ? ` | ${getReadinessStatusLabel(readinessReport.status)}`
            : ""}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/20 p-3">
        {readinessLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-full animate-pulse rounded bg-zinc-900" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-900" />
          </div>
        ) : readinessError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3">
            <p className="text-sm font-medium text-red-100">
              Pre-send check is unavailable right now
            </p>
            <p className="mt-1 text-xs leading-5 text-red-100/90">
              {readinessError}
            </p>
            <button
              type="button"
              onClick={() => onRefreshReadiness()}
              className="mt-3 rounded-xl border border-red-400/40 px-3 py-1.5 text-xs font-medium text-red-100 transition-colors hover:border-red-300 hover:text-white"
            >
              Try again
            </button>
          </div>
        ) : readinessReport ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {readinessReport.readyCount} of{" "}
                  {readinessReport.totalCount} checks ready
                </p>
                <p className="mt-2 text-xs leading-5 text-zinc-400">
                  {readinessReport.readyCount} ready
                  {` | ${readinessReport.attentionCount} need attention`}
                  {` | ${readinessReport.blockerCount} blocking`}
                </p>
              </div>
              <div className="flex min-w-0 flex-col items-start gap-2 sm:items-end">
                <p className="text-xs text-zinc-500">
                  {readinessReport.bundleFilename}
                </p>
                {nextRecommendedPreset && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenInAdapt(
                        currentChapter,
                        readinessReport.nextRecommendedOutputType!
                      )
                    }
                    className="rounded-xl border border-cyan-700 px-3 py-2 text-xs font-medium text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white"
                  >
                    Open next step
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {readinessGroups.map((group) => {
                const preset = group.recommendedOutputType
                  ? getAdaptationPreset(group.recommendedOutputType)
                  : null;

                return (
                  <div
                    key={group.key}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-white">
                            {group.label}
                          </p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${getReadinessStatusClasses(
                              group.status
                            )}`}
                          >
                            {getReadinessStatusLabel(group.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-zinc-400">
                          {group.detail}
                        </p>
                      </div>

                      {preset && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenInAdapt(
                              currentChapter,
                              group.recommendedOutputType!
                            )
                          }
                          className="shrink-0 rounded-xl border border-cyan-700 px-3 py-1.5 text-xs font-medium text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white"
                        >
                          Open {preset.label}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onToggleReadinessDetails()}
                className="text-xs font-medium text-zinc-400 transition-colors hover:text-white"
              >
                {showReadinessDetails
                  ? "Hide detailed checks"
                  : "Show detailed checks"}
              </button>
              <button
                type="button"
                onClick={() => onRefreshReadiness()}
                className="text-xs font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Refresh check
              </button>
            </div>

            {showReadinessDetails && (
              <div className="space-y-2 border-t border-zinc-800 pt-3">
                {visibleReadinessChecks.map((check) => {
                  const preset = check.recommendedOutputType
                    ? getAdaptationPreset(check.recommendedOutputType)
                    : null;

                  return (
                    <div
                      key={check.key}
                      className="rounded-2xl border border-zinc-800 bg-black/20 px-3 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-white">
                              {check.label}
                            </p>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${getReadinessStatusClasses(
                                check.status
                              )}`}
                            >
                              {getReadinessStatusLabel(check.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-zinc-400">
                            {check.detail}
                          </p>
                        </div>

                        {preset && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenInAdapt(
                                currentChapter,
                                check.recommendedOutputType!
                              )
                            }
                            className="shrink-0 rounded-xl border border-cyan-700 px-3 py-1.5 text-xs font-medium text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white"
                          >
                            Open {preset.label}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {hiddenReadyCheckCount > 0 && (
                  <p className="text-xs text-zinc-500">
                    {hiddenReadyCheckCount} ready check
                    {hiddenReadyCheckCount === 1 ? "" : "s"} hidden to keep the
                    detailed view focused.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            Readiness will appear once the current issue is available.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            onExportBundle("download");
          }}
          disabled={!canExport || exportingBundle}
          className="inline-flex items-center gap-1 rounded-xl border border-cyan-700 px-3 py-2 text-sm text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {exportingBundle ? "Preparing..." : "Download bundle"}
        </button>
        <button
          type="button"
          onClick={() => {
            onExportBundle("copy");
          }}
          disabled={exportingBundle}
          className="hidden items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
        >
          <Copy className="h-4 w-4" />
          {exportingBundle ? "Preparing..." : "Copy bundle"}
        </button>
        <button
          type="button"
          onClick={() => onToggleExportOptions()}
          className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white sm:hidden"
        >
          {showExportOptions
            ? "Hide export options"
            : "More export options"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${
              showExportOptions ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {showExportOptions && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              onExportBundle("copy");
            }}
            disabled={!canExport || exportingBundle}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Copy className="h-4 w-4" />
            {exportingBundle ? "Preparing..." : "Copy bundle"}
          </button>
        </div>
      )}

      {exportError && (
        <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {exportError}
        </div>
      )}
    </div>
  );
}
