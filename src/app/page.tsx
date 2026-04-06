"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Layers3,
  LogOut,
  PenLine,
  ScrollText,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import CreateStoryTab from "./components/CreateStoryTab";
import Library from "./components/Library";
import StoryEditor from "./components/editor/StoryEditor";
import {
  LANDING_MODES,
  LANDING_PILLARS,
  LANDING_WORKFLOWS,
  PRODUCT_DESCRIPTION,
  PRODUCT_HERO_EYEBROW,
  PRODUCT_NAME,
  PRODUCT_ONE_LINER,
  PRODUCT_SHORT_NAME,
  PRODUCT_TAGLINE,
} from "./lib/product";
import { useAuth } from "./lib/supabase/auth-context";
import { deleteStoryFromDB, getStoriesFromDB } from "./lib/supabase/stories";
import { Story, StoryFormData } from "./types/story";

type View = "create" | "library";

const PILLAR_ICONS = [PenLine, Layers3, WandSparkles, ShieldCheck] as const;
const SYSTEM_CARDS = [
  {
    title: "Memory",
    description: "Keep facts, characters, and project details in one place.",
  },
  {
    title: "Current context",
    description: "See what the system is using right now while you write.",
  },
  {
    title: "Outputs",
    description: "Reuse one saved draft across recaps, summaries, and other versions.",
  },
] as const;

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [view, setView] = useState<View>("create");
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [streamingFormData, setStreamingFormData] =
    useState<StoryFormData | null>(null);
  const [loadingStories, setLoadingStories] = useState(true);

  const loadStories = useCallback(async () => {
    if (!user) {
      setStories([]);
      setLoadingStories(false);
      return;
    }

    setLoadingStories(true);
    try {
      const data = await getStoriesFromDB();
      setStories(data);
    } catch {
      setStories([]);
    } finally {
      setLoadingStories(false);
    }
  }, [user]);

  useEffect(() => {
    // The initial project fetch intentionally lives in a mount effect for this client view.
    void loadStories();
  }, [loadStories]);

  const handleStoryCreated = (story: Story, formData?: StoryFormData | null) => {
    setStories((prev) => [story, ...prev.filter((item) => item.id !== story.id)]);
    setActiveStory(story);
    setStreamingFormData(formData ?? null);
  };

  const handleStoryUpdate = (updated: Story) => {
    setStories((prev) => prev.map((story) => (story.id === updated.id ? updated : story)));
    setActiveStory(updated);
  };

  const handleStoryDelete = async (id: string) => {
    await deleteStoryFromDB(id);
    setStories((prev) => prev.filter((story) => story.id !== id));
    setActiveStory(null);
  };

  const scrollToWorkspace = (nextView?: View) => {
    if (nextView) {
      setView(nextView);
    }

    document.getElementById("workspace")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (activeStory) {
    return (
      <StoryEditor
        story={activeStory}
        streamingFormData={streamingFormData}
        onBack={() => {
          setActiveStory(null);
          setStreamingFormData(null);
        }}
        onUpdate={handleStoryUpdate}
        onDelete={handleStoryDelete}
        onStreamingComplete={() => setStreamingFormData(null)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_rgba(9,9,11,0.96)_32%),linear-gradient(180deg,_#09090b_0%,_#111827_100%)] text-white">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300">
              {PRODUCT_SHORT_NAME}
            </p>
            <h1 className="truncate text-lg font-semibold text-white">
              {PRODUCT_NAME}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => scrollToWorkspace("create")}
                  className="hidden rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white sm:inline-flex"
                >
                  Start new
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-cyan-400"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_420px] lg:items-start">
          <div className="space-y-8">
          <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-300">
                {PRODUCT_HERO_EYEBROW}
              </p>
              <h2 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                {PRODUCT_ONE_LINER}
              </h2>
              <p className="max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
                {PRODUCT_TAGLINE} Write, keep your facts in one place, and reuse
                the same project across outputs.
              </p>
              <p className="max-w-3xl text-sm leading-7 text-zinc-500 sm:text-base">
                {PRODUCT_DESCRIPTION}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => scrollToWorkspace("create")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-400"
                  >
                    Start writing
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToWorkspace("library")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    Open library
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-400"
                  >
                    Sign in to start
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("how-it-works")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    See how it works
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {LANDING_MODES.map((mode) => (
                <span
                  key={mode}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300"
                >
                  {mode}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/6 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="rounded-[28px] border border-white/8 bg-zinc-950/75 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300">
                    Live now
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Write, remember, adapt, review
                  </p>
                </div>
                <div className="rounded-2xl bg-cyan-500/15 p-2 text-cyan-200">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {SYSTEM_CARDS.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
                  >
                    <p className="text-sm font-medium text-white">{card.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {user && (
        <WorkspaceSection
          signedIn
          authLoading={authLoading}
          view={view}
          stories={stories}
          loadingStories={loadingStories}
          onSetView={setView}
          onStoryCreated={handleStoryCreated}
          onSelectStory={setActiveStory}
        />
      )}

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <SectionHeading
          eyebrow="Core Loop"
          title="One workspace for writing, memory, review, and outputs"
          description="Keep the default loop simple: write, remember, review, and reuse the same project."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {LANDING_PILLARS.map((pillar, index) => {
            const Icon = PILLAR_ICONS[index];
            return (
              <div
                key={pillar.title}
                className="rounded-3xl border border-white/8 bg-white/5 p-5"
              >
                <div className="rounded-2xl bg-white/8 p-2 text-cyan-200 w-fit">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <SectionHeading
          eyebrow="Example Flows"
          title="Use one project as the source of truth for many outputs"
          description="These are the kinds of loops that turn the product into a true writing platform."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {LANDING_WORKFLOWS.map((workflow) => (
            <div
              key={workflow.title}
              className="rounded-3xl border border-white/8 bg-zinc-950/60 p-5"
            >
              <p className="text-sm font-semibold text-white">{workflow.title}</p>
              <p className="mt-2 text-sm leading-7 text-zinc-400">
                {workflow.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {!user && (
        <WorkspaceSection
          signedIn={false}
          authLoading={authLoading}
          view={view}
          stories={stories}
          loadingStories={loadingStories}
          onSetView={setView}
          onStoryCreated={handleStoryCreated}
          onSelectStory={setActiveStory}
        />
      )}
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-zinc-400 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function WorkspaceSection({
  signedIn,
  authLoading,
  view,
  stories,
  loadingStories,
  onSetView,
  onStoryCreated,
  onSelectStory,
}: {
  signedIn: boolean;
  authLoading: boolean;
  view: View;
  stories: Story[];
  loadingStories: boolean;
  onSetView: (view: View) => void;
  onStoryCreated: (story: Story, formData?: StoryFormData | null) => void;
  onSelectStory: (story: Story) => void;
}) {
  return (
    <section id="workspace" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="rounded-[36px] border border-white/10 bg-black/20 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-5">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300">
              Workspace
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              {signedIn ? "Start new or reopen a project" : "Start new or continue a saved project"}
            </h3>
            <p className="mt-2 text-sm leading-7 text-zinc-400">
              {signedIn
                ? "Keep the next step simple: start something new, or reopen a saved project without digging through the rest of the page."
                : "Keep the default choice simple: start something new, or open a project that already exists."}
            </p>
          </div>

          {signedIn && (
            <div className="inline-flex rounded-2xl border border-zinc-800 bg-zinc-950/80 p-1">
              <button
                type="button"
                onClick={() => onSetView("create")}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  view === "create"
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Start new
              </button>
              <button
                type="button"
                onClick={() => onSetView("library")}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  view === "library"
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Open saved
              </button>
            </div>
          )}
        </div>

        <div className="pt-6">
          {authLoading ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 px-6 py-12 text-center">
              <p className="text-sm text-zinc-400">Getting your workspace ready...</p>
            </div>
          ) : signedIn ? (
            view === "create" ? (
              <CreateStoryTab onStoryCreated={onStoryCreated} />
            ) : loadingStories ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 px-6 py-12 text-center">
                <p className="text-sm text-zinc-400">Loading your saved projects...</p>
              </div>
            ) : (
              <Library
                stories={stories}
                onSelectStory={onSelectStory}
                onCreateFirstProject={() => onSetView("create")}
              />
            )
          ) : (
            <div className="grid gap-6 rounded-[32px] border border-zinc-800 bg-zinc-950/70 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <p className="text-lg font-semibold text-white">
                  Sign in to access the live workspace
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
                  Sign in to create projects, save progress, and keep your
                  memory, outputs, and review in one place.
                </p>
              </div>

              <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-cyan-200" />
                  <p className="text-sm font-semibold text-white">
                    What you get after sign-in
                  </p>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                  <li>Start fiction or newsletter projects</li>
                  <li>Save facts, plans, and outputs</li>
                  <li>Pick up where you left off</li>
                </ul>
                <Link
                  href="/login"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-400"
                >
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
