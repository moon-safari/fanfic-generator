"use client";

import { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { buildNewsletterMemorySnapshot } from "../../lib/newsletterMemory";
import type { NewsletterModeConfig } from "../../types/story";
import type {
  BibleNotesContent,
  BibleOutlineContent,
  BibleStyleGuideContent,
  BibleSynopsisContent,
} from "../../types/bible";
import type { PlanningArtifact, ProjectArtifact } from "../../types/artifact";
import NewsletterPublicationProfile from "./NewsletterPublicationProfile";

interface NewsletterSetupPanelProps {
  storyTitle: string;
  currentChapter: number;
  artifacts: ProjectArtifact[];
  newsletterProfileDraft: NewsletterModeConfig;
  savingNewsletterProfile: boolean;
  newsletterProfileError: string | null;
  showSetup: boolean;
  onToggleSetup: () => void;
  onProfileChange: (draft: NewsletterModeConfig) => void;
}

export default function NewsletterSetupPanel({
  storyTitle,
  currentChapter,
  artifacts,
  newsletterProfileDraft,
  savingNewsletterProfile,
  newsletterProfileError,
  showSetup,
  onToggleSetup,
  onProfileChange,
}: NewsletterSetupPanelProps) {
  const newsletterMemory = buildNewsletterMemorySnapshot({
    storyTitle,
    modeConfig: newsletterProfileDraft,
    synopsis: artifacts.find(
      (artifact): artifact is PlanningArtifact =>
        artifact.kind === "planning" && artifact.sectionType === "synopsis"
    )?.rawContent as BibleSynopsisContent | undefined,
    styleGuide: artifacts.find(
      (artifact): artifact is PlanningArtifact =>
        artifact.kind === "planning" && artifact.sectionType === "style_guide"
    )?.rawContent as BibleStyleGuideContent | undefined,
    outline: artifacts.find(
      (artifact): artifact is PlanningArtifact =>
        artifact.kind === "planning" && artifact.sectionType === "outline"
    )?.rawContent as BibleOutlineContent | undefined,
    notes: artifacts.find(
      (artifact): artifact is PlanningArtifact =>
        artifact.kind === "planning" && artifact.sectionType === "notes"
    )?.rawContent as BibleNotesContent | undefined,
    currentUnitNumber: currentChapter,
  });

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              Newsletter setup
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Publication profile, recurring sections, and saved setup.
              Open this only when you want to change the setup.
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
          {newsletterMemory && (
            <NewsletterMemoryPanel
              snapshot={newsletterMemory}
              currentChapter={currentChapter}
            />
          )}

          <NewsletterPublicationProfile
            value={newsletterProfileDraft}
            saving={savingNewsletterProfile}
            error={newsletterProfileError}
            onChange={onProfileChange}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function NewsletterMemoryPanel({
  snapshot,
  currentChapter,
}: {
  snapshot: ReturnType<typeof buildNewsletterMemorySnapshot>;
  currentChapter: number;
}) {
  const [showSetupContext, setShowSetupContext] = useState(false);
  const setupSummary = [
    snapshot.recurringSections.length > 0
      ? `${snapshot.recurringSections.length} recurring section${snapshot.recurringSections.length === 1 ? "" : "s"}`
      : null,
    snapshot.dueThreads.length > 0
      ? `${snapshot.dueThreads.length} follow-up${snapshot.dueThreads.length === 1 ? "" : "s"} due`
      : null,
    snapshot.voiceGuides.length > 0
      ? `${snapshot.voiceGuides.length} voice guardrail${snapshot.voiceGuides.length === 1 ? "" : "s"}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <div className="mt-4 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-cyan-500/10 p-2 text-cyan-200">
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Saved setup</p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              The saved setup the system uses to keep issues aligned for readers,
              promise, and voice.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowSetupContext((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
        >
          {showSetupContext ? "Hide details" : "More setup context"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${
              showSetupContext ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MemoryMetric label="Audience" value={snapshot.audience} />
        <MemoryMetric label="Current angle" value={snapshot.currentAngle} />
      </div>

      {setupSummary && (
        <p className="mt-3 text-xs leading-5 text-zinc-400">{setupSummary}</p>
      )}

      {showSetupContext && (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <MemoryMetric label="Subtitle" value={snapshot.subtitle} />
            <MemoryMetric label="Cadence" value={snapshot.cadence} />
          </div>

          {snapshot.seriesPromise && (
            <div className="mt-3 rounded-2xl border border-zinc-800 bg-black/20 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Series promise
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-200">
                {snapshot.seriesPromise}
              </p>
            </div>
          )}

          {snapshot.voiceGuides.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Voice guardrails
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {snapshot.voiceGuides.map((guide) => (
                  <span
                    key={guide}
                    className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-200"
                  >
                    {guide}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(snapshot.hookApproach || snapshot.ctaStyle) && (
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <MemoryMetric label="Hook approach" value={snapshot.hookApproach} />
              <MemoryMetric label="CTA style" value={snapshot.ctaStyle} />
            </div>
          )}

          {snapshot.recurringSections.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Recurring sections
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {snapshot.recurringSections.map((section) => (
                  <span
                    key={section}
                    className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-200"
                  >
                    {section}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(snapshot.currentUnitPlan.length > 0 || snapshot.dueThreads.length > 0) && (
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {snapshot.currentUnitPlan.length > 0 && (
                <MemoryList
                  title={`Issue ${currentChapter} plan`}
                  items={snapshot.currentUnitPlan}
                />
              )}
              {snapshot.dueThreads.length > 0 && (
                <MemoryList title="Due follow-ups" items={snapshot.dueThreads} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MemoryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value.trim()) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/20 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-200">{value}</p>
    </div>
  );
}

function MemoryList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/20 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {title}
      </p>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <p key={item} className="text-sm leading-6 text-zinc-200">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
