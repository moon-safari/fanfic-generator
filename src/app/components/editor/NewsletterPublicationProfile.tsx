"use client";

import { useState, type ReactNode } from "react";
import { Mail, Plus, Trash2 } from "lucide-react";
import type {
  NewsletterCadence,
  NewsletterModeConfig,
} from "../../types/story";

interface NewsletterPublicationProfileProps {
  value: NewsletterModeConfig;
  saving: boolean;
  error?: string | null;
  onChange: (nextValue: NewsletterModeConfig) => void;
}

const CADENCE_OPTIONS: NewsletterCadence[] = [
  "weekly",
  "biweekly",
  "monthly",
  "irregular",
];

export default function NewsletterPublicationProfile({
  value,
  saving,
  error,
  onChange,
}: NewsletterPublicationProfileProps) {
  const [newSection, setNewSection] = useState("");
  const [showAdvancedSetup, setShowAdvancedSetup] = useState(false);

  const recurringSections = value.recurringSections ?? [];

  return (
    <div className="mt-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-500/15 p-2 text-emerald-200">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Publication profile
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              Define the newsletter identity the system should preserve across
              issues, reviews, and adaptations.
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs ${
            saving
              ? "bg-cyan-500/15 text-cyan-200"
              : "bg-zinc-900 text-zinc-300"
          }`}
        >
          {saving ? "Saving..." : "Saved"}
        </span>
      </div>

      {error && (
        <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Audience">
          <input
            type="text"
            value={value.audience}
            onChange={(event) =>
              onChange({ ...value, audience: event.target.value })
            }
            placeholder="Who this publication is really for"
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </Field>

        <Field label="Topic">
          <input
            type="text"
            value={value.topic}
            onChange={(event) =>
              onChange({ ...value, topic: event.target.value })
            }
            placeholder="What this publication consistently covers"
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </Field>

      </div>

      <div className="mt-3">
        <Field label="Issue angle">
          <textarea
            value={value.issueAngle}
            onChange={(event) =>
              onChange({ ...value, issueAngle: event.target.value })
            }
            rows={4}
            placeholder="What this issue is trying to say or explore"
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-3 py-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-3 rounded-2xl border border-zinc-800 bg-black/20 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              More setup
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Lower-priority publication details and defaults.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvancedSetup((prev) => !prev)}
            className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            {showAdvancedSetup ? "Hide" : "Open"}
          </button>
        </div>

        {showAdvancedSetup && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Subtitle">
              <input
                type="text"
                value={value.subtitle ?? ""}
                onChange={(event) =>
                  onChange({ ...value, subtitle: event.target.value })
                }
                placeholder="Optional tagline or publication descriptor"
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </Field>

            <Field label="Cadence">
              <div className="flex flex-wrap gap-2">
                {CADENCE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onChange({ ...value, cadence: option })}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      value.cadence === option
                        ? "border-emerald-500 bg-emerald-500/15 text-white"
                        : "border-zinc-700 bg-zinc-950/80 text-zinc-400 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    {labelCadence(option)}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Hook approach">
              <textarea
                value={value.hookApproach ?? ""}
                onChange={(event) =>
                  onChange({ ...value, hookApproach: event.target.value })
                }
                rows={3}
                placeholder="How issues should usually open"
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-3 py-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </Field>

            <Field label="CTA style">
              <textarea
                value={value.ctaStyle ?? ""}
                onChange={(event) =>
                  onChange({ ...value, ctaStyle: event.target.value })
                }
                rows={3}
                placeholder="How issues should usually close or invite response"
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-3 py-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </Field>
          </div>
        )}
      </div>

      <div className="mt-3 rounded-2xl border border-zinc-800 bg-black/20 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Recurring sections
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Capture the signature blocks or rhythms readers should keep seeing.
            </p>
          </div>
          <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-300">
            {recurringSections.length}
          </span>
        </div>

        {recurringSections.length > 0 && (
          <div className="mt-3 space-y-2">
            {recurringSections.map((section, index) => (
              <div
                key={`${section}-${index}`}
                className="flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <input
                  type="text"
                  value={section}
                  onChange={(event) =>
                    updateSection(index, event.target.value)
                  }
                  onBlur={() => normalizeSection(index)}
                  placeholder="Recurring section"
                  className="min-w-0 flex-1 rounded-2xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="inline-flex shrink-0 items-center justify-center gap-1 rounded-2xl border border-red-900 px-3 py-2.5 text-sm text-red-200 transition-colors hover:border-red-600 hover:text-white"
                  aria-label={`Delete ${section || "recurring section"}`}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newSection}
            onChange={(event) => setNewSection(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addSection();
              }
            }}
            placeholder="Add a recurring section"
            className="min-w-0 flex-1 rounded-2xl border border-zinc-700 bg-zinc-950/80 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={addSection}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-2xl border border-zinc-700 px-3 py-2.5 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Add section
          </button>
        </div>
      </div>
    </div>
  );

  function addSection() {
    const normalized = newSection.trim();
    if (!normalized) {
      return;
    }

    if (recurringSections.some((section) => section.toLowerCase() === normalized.toLowerCase())) {
      setNewSection("");
      return;
    }

    onChange({
      ...value,
      recurringSections: [...recurringSections, normalized].slice(0, 8),
    });
    setNewSection("");
  }

  function updateSection(index: number, nextValue: string) {
    onChange({
      ...value,
      recurringSections: recurringSections.map((section, candidateIndex) =>
        candidateIndex === index ? nextValue : section
      ),
    });
  }

  function normalizeSection(index: number) {
    const normalized = recurringSections[index]?.trim() ?? "";

    if (!normalized) {
      removeSection(index);
      return;
    }

    const nextSections = recurringSections.map((section, candidateIndex) =>
      candidateIndex === index ? normalized : section.trim()
    );
    const duplicateIndex = nextSections.findIndex(
      (section, candidateIndex) =>
        candidateIndex !== index
        && section.toLowerCase() === normalized.toLowerCase()
    );

    if (duplicateIndex >= 0) {
      removeSection(index);
      return;
    }

    onChange({
      ...value,
      recurringSections: nextSections,
    });
  }

  function removeSection(index: number) {
    onChange({
      ...value,
      recurringSections: recurringSections.filter(
        (_, candidateIndex) => candidateIndex !== index
      ),
    });
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      {children}
    </div>
  );
}

function labelCadence(value: NewsletterCadence) {
  switch (value) {
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Biweekly";
    case "monthly":
      return "Monthly";
    default:
      return "Irregular";
  }
}
