"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  BookOpen,
  ChevronDown,
  Loader2,
  Mail,
  Sparkles,
} from "lucide-react";
import FandomSelector from "./FandomSelector";
import CharacterSelector from "./CharacterSelector";
import RelationshipSelector from "./RelationshipSelector";
import RatingSelector from "./RatingSelector";
import ToneSelector from "./ToneSelector";
import TropeSelector from "./TropeSelector";
import {
  NewsletterCadence,
  ProjectMode,
  Rating,
  RelationshipType,
  Story,
  StoryFormData,
} from "../types/story";
import { getFandomById } from "../lib/fandoms";
import { NEWSLETTER_VOICE_OPTIONS } from "../lib/newsletter";
import { requestJson } from "../lib/request";
import { createStoryInDB } from "../lib/supabase/stories";

interface CreateStoryTabProps {
  onStoryCreated: (story: Story, formData?: StoryFormData | null) => void;
}

const NEWSLETTER_CADENCE_OPTIONS: NewsletterCadence[] = [
  "weekly",
  "biweekly",
  "monthly",
  "irregular",
];

export default function CreateStoryTab({ onStoryCreated }: CreateStoryTabProps) {
  const [projectMode, setProjectMode] = useState<ProjectMode>("fiction");
  const [showFictionOptions, setShowFictionOptions] = useState(false);
  const [showNewsletterOptions, setShowNewsletterOptions] = useState(false);
  const [fandom, setFandom] = useState("");
  const [customFandom, setCustomFandom] = useState("");
  const [characters, setCharacters] = useState<string[]>(["", "", "", ""]);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("gen");
  const [rating, setRating] = useState<Rating>("mature");
  const [setting, setSetting] = useState("");
  const [fictionTone, setFictionTone] = useState<string[]>([]);
  const [tropes, setTropes] = useState<string[]>([]);

  const [newsletterTitle, setNewsletterTitle] = useState("");
  const [newsletterTopic, setNewsletterTopic] = useState("");
  const [newsletterAudience, setNewsletterAudience] = useState("");
  const [newsletterIssueAngle, setNewsletterIssueAngle] = useState("");
  const [newsletterCadence, setNewsletterCadence] =
    useState<NewsletterCadence>("weekly");
  const [newsletterTone, setNewsletterTone] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [memoryDemoLoading, setMemoryDemoLoading] = useState(false);
  const [newsletterDemoLoading, setNewsletterDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const filledCharacters = characters.filter((value) => value.trim().length >= 2);
  const busy = loading || memoryDemoLoading || newsletterDemoLoading;
  const canSubmit =
    projectMode === "fiction"
      ? filledCharacters.length >= 2 && fictionTone.length >= 1 && !busy
      : newsletterTitle.trim().length >= 2
        && newsletterTopic.trim().length >= 3
        && newsletterAudience.trim().length >= 3
        && newsletterIssueAngle.trim().length >= 8
        && newsletterTone.length >= 1
        && !busy;

  const handleFandomChange = useCallback((id: string) => {
    setFandom(id);
    setCharacters(["", "", "", ""]);
  }, []);

  const fandomData = getFandomById(fandom);
  const settingPlaceholder =
    fandomData?.settingPlaceholder || "Describe your setting...";

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      if (projectMode === "fiction") {
        const formData: StoryFormData = {
          projectMode: "fiction",
          fandom: fandom === "custom" ? "" : fandom,
          customFandom: fandom === "custom" ? customFandom : undefined,
          characters: characters.filter((value) => value.trim().length > 0),
          relationshipType,
          rating,
          setting: setting.trim() || undefined,
          tone: fictionTone,
          tropes,
        };

        const story = await createStoryInDB({
          title: "Generating...",
          projectMode: "fiction",
          modeConfig: {},
          fandom: formData.fandom,
          customFandom: formData.customFandom,
          characters: formData.characters,
          relationshipType: formData.relationshipType,
          rating: formData.rating,
          setting: formData.setting,
          tone: formData.tone,
          tropes: formData.tropes,
        });

        if (!story) {
          throw new Error("Please sign in before creating a new project.");
        }

        onStoryCreated(story, formData);
        return;
      }

      const formData: StoryFormData = {
        projectMode: "newsletter",
        title: newsletterTitle.trim(),
        newsletterTopic: newsletterTopic.trim(),
        audience: newsletterAudience.trim(),
        issueAngle: newsletterIssueAngle.trim(),
        cadence: newsletterCadence,
        tone: newsletterTone,
      };

      const story = await createStoryInDB({
        title: newsletterTitle.trim(),
        projectMode: "newsletter",
        modeConfig: {
          topic: newsletterTopic.trim(),
          audience: newsletterAudience.trim(),
          issueAngle: newsletterIssueAngle.trim(),
          cadence: newsletterCadence,
        },
        fandom: "",
        characters: [],
        relationshipType: "gen",
        rating: "general",
        tone: newsletterTone,
        tropes: [],
      });

      if (!story) {
        throw new Error("Please sign in before creating a new project.");
      }

      onStoryCreated(story, formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShowcase = async () => {
    if (busy) return;

    setMemoryDemoLoading(true);
    setError("");

    try {
      const data = await requestJson<{ story: Story }>(
        "/api/demo/memory-showcase",
        {
          method: "POST",
        }
      );

      onStoryCreated(data.story, null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to open Memory showcase"
      );
    } finally {
      setMemoryDemoLoading(false);
    }
  };

  const handleOpenNewsletterShowcase = async () => {
    if (busy) return;

    setNewsletterDemoLoading(true);
    setError("");

    try {
      const data = await requestJson<{ story: Story }>(
        "/api/demo/newsletter-showcase",
        {
          method: "POST",
        }
      );

      onStoryCreated(data.story, null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to open newsletter showcase"
      );
    } finally {
      setNewsletterDemoLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Start Here
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">
          Choose what you want to start
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Pick a mode, start with the minimum setup, and open more options only
          if you need them.
        </p>

        <div className="mt-4 inline-flex rounded-2xl border border-zinc-800 bg-zinc-950/80 p-1">
          <ModeButton
            label="Fiction"
            active={projectMode === "fiction"}
            onClick={() => setProjectMode("fiction")}
          />
          <ModeButton
            label="Newsletter"
            active={projectMode === "newsletter"}
            onClick={() => setProjectMode("newsletter")}
          />
        </div>
      </div>

      {projectMode === "fiction" ? (
        <>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-300">
              Fiction
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Choose a fandom, a few characters, and a tone. Everything else can wait.
            </p>
          </div>

          <FandomSelector
            selected={fandom}
            customFandom={customFandom}
            onSelect={handleFandomChange}
            onCustomChange={setCustomFandom}
          />

          <CharacterSelector
            fandom={fandom}
            characters={characters}
            onChange={setCharacters}
          />

          <ToneSelector selected={fictionTone} onChange={setFictionTone} />

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <button
              type="button"
              onClick={() => setShowFictionOptions((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-white">More options</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Relationship, rating, setting, and tropes.
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-zinc-400 transition-transform ${
                  showFictionOptions ? "rotate-180" : ""
                }`}
              />
            </button>

            {showFictionOptions && (
              <div className="mt-4 space-y-6">
                <RelationshipSelector
                  selected={relationshipType}
                  onChange={setRelationshipType}
                />

                <RatingSelector selected={rating} onChange={setRating} />

                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">
                    Setting <span className="text-zinc-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={setting}
                    onChange={(event) => setSetting(event.target.value)}
                    placeholder={settingPlaceholder}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <TropeSelector selected={tropes} onChange={setTropes} />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-500/15 p-2 text-emerald-200">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Newsletter
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Set the title, topic, audience, and issue angle. Everything else can wait.
                </p>
              </div>
            </div>
          </div>

          <Field
            label="Newsletter title"
            helper="This is the project title that stays attached to the series."
          >
            <input
              type="text"
              value={newsletterTitle}
              onChange={(event) => setNewsletterTitle(event.target.value)}
              placeholder="The Quiet Signal"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
            />
          </Field>

          <Field
            label="Topic"
            helper="What does this newsletter consistently cover?"
          >
            <input
              type="text"
              value={newsletterTopic}
              onChange={(event) => setNewsletterTopic(event.target.value)}
              placeholder="Creative systems, writing workflow, and product thinking"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
            />
          </Field>

          <Field
            label="Audience"
            helper="Who is this for, specifically?"
          >
            <input
              type="text"
              value={newsletterAudience}
              onChange={(event) => setNewsletterAudience(event.target.value)}
              placeholder="Solo creators building serious long-form projects"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
            />
          </Field>

          <Field
            label="Issue 1 angle"
            helper="What is the first issue trying to argue, explain, or unpack?"
          >
            <textarea
              value={newsletterIssueAngle}
              onChange={(event) => setNewsletterIssueAngle(event.target.value)}
              placeholder="Why most AI writing tools feel disposable, and why project memory changes the whole product category."
              rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Voice</p>
            <p className="mb-3 text-xs leading-5 text-zinc-500">
              Pick the tone the system should preserve across issues.
            </p>
            <ToneSelector
              label="Voice"
              showLabel={false}
              options={NEWSLETTER_VOICE_OPTIONS}
              selected={newsletterTone}
              onChange={setNewsletterTone}
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <button
              type="button"
              onClick={() => setShowNewsletterOptions((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-white">More options</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Cadence and lower-priority setup.
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-zinc-400 transition-transform ${
                  showNewsletterOptions ? "rotate-180" : ""
                }`}
              />
            </button>

            {showNewsletterOptions && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-zinc-300">Cadence</p>
                <div className="flex flex-wrap gap-2">
                  {NEWSLETTER_CADENCE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setNewsletterCadence(option)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        newsletterCadence === option
                          ? "border-emerald-500 bg-emerald-500/15 text-white"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
                      }`}
                    >
                      {labelCadence(option)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="rounded-lg border border-red-700 bg-red-900/50 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 font-semibold text-white transition-all hover:bg-purple-500 active:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Creating your project...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            {projectMode === "newsletter"
              ? "Start newsletter project"
              : "Start fiction project"}
          </>
        )}
      </button>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-purple-300" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              Try sample projects
            </h3>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Open a sample fiction or newsletter project if you want to look
              around before starting from scratch.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => {
              void handleOpenShowcase();
            }}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {memoryDemoLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening fiction sample...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                Open fiction sample
              </>
            )}
          </button>

          <button
            onClick={() => {
              void handleOpenNewsletterShowcase();
            }}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-700 px-4 py-2.5 text-sm font-medium text-emerald-100 transition-colors hover:border-emerald-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {newsletterDemoLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening newsletter sample...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Open newsletter sample
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-300">
        {label}
      </label>
      {helper && <p className="mb-2 text-xs leading-5 text-zinc-500">{helper}</p>}
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
