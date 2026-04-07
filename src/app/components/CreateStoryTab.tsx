"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  BookOpen,
  Clapperboard,
  ChevronDown,
  FileText,
  Gamepad2,
  Loader2,
  Mail,
  PanelsTopLeft,
  Sparkles,
} from "lucide-react";
import FandomSelector from "./FandomSelector";
import CharacterSelector from "./CharacterSelector";
import RelationshipSelector from "./RelationshipSelector";
import RatingSelector from "./RatingSelector";
import ToneSelector from "./ToneSelector";
import TropeSelector from "./TropeSelector";
import {
  ComicsSeriesEngine,
  GameWritingQuestEngine,
  NewsletterCadence,
  NonFictionPieceEngine,
  ProjectMode,
  Rating,
  RelationshipType,
  ScreenplayDraftingPreference,
  ScreenplayStoryEngine,
  Story,
  StoryFormData,
} from "../types/story";
import {
  COMICS_SERIES_ENGINES,
  DEFAULT_COMICS_MODE_CONFIG,
  labelComicsSeriesEngine,
} from "../lib/comicsModeConfig";
import {
  DEFAULT_GAME_WRITING_MODE_CONFIG,
  GAME_WRITING_QUEST_ENGINES,
  labelGameWritingQuestEngine,
} from "../lib/gameWritingModeConfig";
import {
  DEFAULT_NON_FICTION_MODE_CONFIG,
  labelNonFictionPieceEngine,
  NON_FICTION_PIECE_ENGINES,
} from "../lib/nonFictionModeConfig";
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
  const [screenplayTitle, setScreenplayTitle] = useState("");
  const [screenplayTone, setScreenplayTone] = useState<string[]>([]);
  const [screenplayDraftingPreference, setScreenplayDraftingPreference] =
    useState<ScreenplayDraftingPreference>("script_pages");
  const [screenplayStoryEngine, setScreenplayStoryEngine] =
    useState<ScreenplayStoryEngine>("feature");
  const [showScreenplayOptions, setShowScreenplayOptions] = useState(false);
  const [comicsTitle, setComicsTitle] = useState("");
  const [comicsTone, setComicsTone] = useState<string[]>([]);
  const [comicsSeriesEngine, setComicsSeriesEngine] =
    useState<ComicsSeriesEngine>(
      DEFAULT_COMICS_MODE_CONFIG.seriesEngine ?? "issue"
    );
  const [showComicsOptions, setShowComicsOptions] = useState(false);
  const [gameWritingTitle, setGameWritingTitle] = useState("");
  const [gameWritingTone, setGameWritingTone] = useState<string[]>([]);
  const [gameWritingQuestEngine, setGameWritingQuestEngine] =
    useState<GameWritingQuestEngine>(
      DEFAULT_GAME_WRITING_MODE_CONFIG.questEngine ?? "main_quest"
    );
  const [showGameWritingOptions, setShowGameWritingOptions] = useState(false);
  const [nonFictionTitle, setNonFictionTitle] = useState("");
  const [nonFictionTone, setNonFictionTone] = useState<string[]>([]);
  const [nonFictionPieceEngine, setNonFictionPieceEngine] =
    useState<NonFictionPieceEngine>(
      DEFAULT_NON_FICTION_MODE_CONFIG.pieceEngine ?? "article"
    );
  const [showNonFictionOptions, setShowNonFictionOptions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [memoryDemoLoading, setMemoryDemoLoading] = useState(false);
  const [newsletterDemoLoading, setNewsletterDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const filledCharacters = characters.filter((value) => value.trim().length >= 2);
  const busy = loading || memoryDemoLoading || newsletterDemoLoading;
  const canSubmit =
    projectMode === "fiction"
      ? filledCharacters.length >= 2 && fictionTone.length >= 1 && !busy
      : projectMode === "newsletter"
        ? newsletterTitle.trim().length >= 2
          && newsletterTopic.trim().length >= 3
          && newsletterAudience.trim().length >= 3
          && newsletterIssueAngle.trim().length >= 8
          && newsletterTone.length >= 1
          && !busy
        : projectMode === "screenplay"
          ? screenplayTitle.trim().length >= 2
            && screenplayTone.length >= 1
            && !busy
        : projectMode === "comics"
          ? comicsTitle.trim().length >= 2
            && comicsTone.length >= 1
            && !busy
        : projectMode === "game_writing"
          ? gameWritingTitle.trim().length >= 2
            && gameWritingTone.length >= 1
            && !busy
        : nonFictionTitle.trim().length >= 2
          && nonFictionTone.length >= 1
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

      if (projectMode === "screenplay") {
        const formData: StoryFormData = {
          projectMode: "screenplay",
          title: screenplayTitle.trim(),
          draftingPreference: screenplayDraftingPreference,
          tone: screenplayTone,
          storyEngine: screenplayStoryEngine,
        };

        const story = await createStoryInDB({
          title: screenplayTitle.trim(),
          projectMode: "screenplay",
          modeConfig: {
            draftingPreference: screenplayDraftingPreference,
            formatStyle: "fountain",
            storyEngine: screenplayStoryEngine,
          },
          fandom: "",
          characters: [],
          relationshipType: "gen",
          rating: "teen",
          tone: screenplayTone,
          tropes: [],
        });

        if (!story) {
          throw new Error("Please sign in before creating a new project.");
        }

        onStoryCreated(story, formData);
        return;
      }

      if (projectMode === "comics") {
        const formData: StoryFormData = {
          projectMode: "comics",
          title: comicsTitle.trim(),
          tone: comicsTone,
          seriesEngine: comicsSeriesEngine,
        };

        const story = await createStoryInDB({
          title: comicsTitle.trim(),
          projectMode: "comics",
          modeConfig: {
            ...DEFAULT_COMICS_MODE_CONFIG,
            seriesEngine: comicsSeriesEngine,
          },
          fandom: "",
          characters: [],
          relationshipType: "gen",
          rating: "teen",
          tone: comicsTone,
          tropes: [],
        });

        if (!story) {
          throw new Error("Please sign in before creating a new project.");
        }

        onStoryCreated(story, formData);
        return;
      }

      if (projectMode === "game_writing") {
        const formData: StoryFormData = {
          projectMode: "game_writing",
          title: gameWritingTitle.trim(),
          tone: gameWritingTone,
          questEngine: gameWritingQuestEngine,
        };

        const story = await createStoryInDB({
          title: gameWritingTitle.trim(),
          projectMode: "game_writing",
          modeConfig: {
            ...DEFAULT_GAME_WRITING_MODE_CONFIG,
            questEngine: gameWritingQuestEngine,
          },
          fandom: "",
          characters: [],
          relationshipType: "gen",
          rating: "teen",
          tone: gameWritingTone,
          tropes: [],
        });

        if (!story) {
          throw new Error("Please sign in before creating a new project.");
        }

        onStoryCreated(story, formData);
        return;
      }

      if (projectMode === "non_fiction") {
        const formData: StoryFormData = {
          projectMode: "non_fiction",
          title: nonFictionTitle.trim(),
          tone: nonFictionTone,
          pieceEngine: nonFictionPieceEngine,
        };

        const story = await createStoryInDB({
          title: nonFictionTitle.trim(),
          projectMode: "non_fiction",
          modeConfig: {
            ...DEFAULT_NON_FICTION_MODE_CONFIG,
            pieceEngine: nonFictionPieceEngine,
          },
          fandom: "",
          characters: [],
          relationshipType: "gen",
          rating: "general",
          tone: nonFictionTone,
          tropes: [],
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
            label="Screenplay"
            active={projectMode === "screenplay"}
            onClick={() => setProjectMode("screenplay")}
          />
          <ModeButton
            label="Comics"
            active={projectMode === "comics"}
            onClick={() => setProjectMode("comics")}
          />
          <ModeButton
            label="Game Writing"
            active={projectMode === "game_writing"}
            onClick={() => setProjectMode("game_writing")}
          />
          <ModeButton
            label="Non-Fiction"
            active={projectMode === "non_fiction"}
            onClick={() => setProjectMode("non_fiction")}
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
      ) : projectMode === "screenplay" ? (
        <>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-500/15 p-2 text-amber-200">
                <Clapperboard className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                  Screenplay
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Set the title, choose a drafting style, and pick the tone for Scene 1.
                </p>
              </div>
            </div>
          </div>

          <Field
            label="Screenplay title"
            helper="This is the working title and will stay attached to the project."
          >
            <input
              type="text"
              value={screenplayTitle}
              onChange={(event) => setScreenplayTitle(event.target.value)}
              placeholder="Glass Hour"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">
              Drafting preference
            </p>
            <p className="mb-3 text-xs leading-5 text-zinc-500">
              Choose whether the editor should default to screenplay pages or a scene-beat draft.
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "script_pages",
                  "beat_draft",
                ] satisfies ScreenplayDraftingPreference[]
              ).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScreenplayDraftingPreference(option)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    screenplayDraftingPreference === option
                      ? "border-amber-500 bg-amber-500/15 text-white"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
                  }`}
                >
                  {labelScreenplayDraftingPreference(option)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Tone</p>
            <p className="mb-3 text-xs leading-5 text-zinc-500">
              Pick the energy the system should preserve across scenes.
            </p>
            <ToneSelector
              label="Tone"
              showLabel={false}
              selected={screenplayTone}
              onChange={setScreenplayTone}
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <button
              type="button"
              onClick={() => setShowScreenplayOptions((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-white">More options</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Story engine and lower-priority setup.
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-zinc-400 transition-transform ${
                  showScreenplayOptions ? "rotate-180" : ""
                }`}
              />
            </button>

            {showScreenplayOptions && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-zinc-300">Story engine</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "feature",
                      "pilot",
                      "short",
                    ] satisfies ScreenplayStoryEngine[]
                  ).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setScreenplayStoryEngine(option)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        screenplayStoryEngine === option
                          ? "border-amber-500 bg-amber-500/15 text-white"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
                      }`}
                    >
                      {labelScreenplayStoryEngine(option)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : projectMode === "comics" ? (
        <>
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-cyan-500/15 p-2 text-cyan-200">
                <PanelsTopLeft className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Comics
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Start with a title, tone, and scope so future pages know how
                  hard to push reveals and pacing.
                </p>
              </div>
            </div>
          </div>

          <Field
            label="Project title"
            helper="This is the working title and will stay attached to the comic project."
          >
            <input
              type="text"
              value={comicsTitle}
              onChange={(event) => setComicsTitle(event.target.value)}
              placeholder="Ash Canary"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Tone</p>
            <p className="mb-3 text-xs leading-5 text-zinc-500">
              Pick the tone the system should preserve across page turns.
            </p>
            <ToneSelector
              label="Tone"
              showLabel={false}
              selected={comicsTone}
              onChange={setComicsTone}
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <button
              type="button"
              onClick={() => setShowComicsOptions((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-white">More options</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Series scope and future pacing defaults.
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-zinc-400 transition-transform ${
                  showComicsOptions ? "rotate-180" : ""
                }`}
              />
            </button>

            {showComicsOptions && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-zinc-300">
                  Series scope
                </p>
                <p className="mb-3 text-xs leading-5 text-zinc-500">
                  This shapes pacing pressure, reveal timing, and payoff horizon
                  for future pages.
                </p>
                <div className="flex flex-wrap gap-2">
                  {COMICS_SERIES_ENGINES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setComicsSeriesEngine(option)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        comicsSeriesEngine === option
                          ? "border-cyan-500 bg-cyan-500/15 text-white"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
                      }`}
                    >
                      {labelComicsSeriesEngine(option)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : projectMode === "game_writing" ? (
        <>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-sky-500/15 p-2 text-sky-200">
                <Gamepad2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                  Game Writing
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Start with a title, tone, and quest scope so future quests know
                  how hard to push consequence and follow-up pressure.
                </p>
              </div>
            </div>
          </div>

          <Field
            label="Project title"
            helper="This is the working title and will stay attached to the game-writing project."
          >
            <input
              type="text"
              value={gameWritingTitle}
              onChange={(event) => setGameWritingTitle(event.target.value)}
              placeholder="Ashes of Red Hollow"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none"
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Tone</p>
            <p className="mb-3 text-xs leading-5 text-zinc-500">
              Pick the narrative energy the system should preserve across quests.
            </p>
            <ToneSelector
              label="Tone"
              showLabel={false}
              selected={gameWritingTone}
              onChange={setGameWritingTone}
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <button
              type="button"
              onClick={() => setShowGameWritingOptions((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-white">More options</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Quest scope and future consequence defaults.
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-zinc-400 transition-transform ${
                  showGameWritingOptions ? "rotate-180" : ""
                }`}
              />
            </button>

            {showGameWritingOptions && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-zinc-300">
                  Quest engine
                </p>
                <p className="mb-3 text-xs leading-5 text-zinc-500">
                  This shapes scope, consequence pressure, and payoff horizon for
                  future quests.
                </p>
                <div className="flex flex-wrap gap-2">
                  {GAME_WRITING_QUEST_ENGINES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setGameWritingQuestEngine(option)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        gameWritingQuestEngine === option
                          ? "border-sky-500 bg-sky-500/15 text-white"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
                      }`}
                    >
                      {labelGameWritingQuestEngine(option)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : projectMode === "non_fiction" ? (
        <>
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-orange-500/15 p-2 text-orange-200">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
                  Non-Fiction
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Start with a title, tone, and piece engine so future sections
                  know how hard to push claims, evidence, and argument flow.
                </p>
              </div>
            </div>
          </div>

          <Field
            label="Project title"
            helper="This is the working title and will stay attached to the article or essay project."
          >
            <input
              type="text"
              value={nonFictionTitle}
              onChange={(event) => setNonFictionTitle(event.target.value)}
              placeholder="The Cost of Shallow Tools"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Tone</p>
            <p className="mb-3 text-xs leading-5 text-zinc-500">
              Pick the editorial energy the system should preserve across sections.
            </p>
            <ToneSelector
              label="Tone"
              showLabel={false}
              selected={nonFictionTone}
              onChange={setNonFictionTone}
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <button
              type="button"
              onClick={() => setShowNonFictionOptions((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-white">More options</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Piece engine and future section defaults.
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-zinc-400 transition-transform ${
                  showNonFictionOptions ? "rotate-180" : ""
                }`}
              />
            </button>

            {showNonFictionOptions && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-zinc-300">
                  Piece engine
                </p>
                <p className="mb-3 text-xs leading-5 text-zinc-500">
                  This shapes argument cadence, section voice, and evidence framing
                  for future sections.
                </p>
                <div className="flex flex-wrap gap-2">
                  {NON_FICTION_PIECE_ENGINES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setNonFictionPieceEngine(option)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        nonFictionPieceEngine === option
                          ? "border-orange-500 bg-orange-500/15 text-white"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
                      }`}
                    >
                      {labelNonFictionPieceEngine(option)}
                    </button>
                  ))}
                </div>
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
              : projectMode === "screenplay"
                ? "Start screenplay project"
                : projectMode === "comics"
                  ? "Start comics project"
                : projectMode === "game_writing"
                  ? "Start game writing project"
                : projectMode === "non_fiction"
                  ? "Start non-fiction project"
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

function labelScreenplayDraftingPreference(
  value: ScreenplayDraftingPreference
) {
  return value === "script_pages" ? "Script pages" : "Beat draft";
}

function labelScreenplayStoryEngine(value: ScreenplayStoryEngine) {
  switch (value) {
    case "pilot":
      return "Pilot";
    case "short":
      return "Short";
    default:
      return "Feature";
  }
}
