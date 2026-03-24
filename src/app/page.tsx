"use client";

import { useState, useEffect } from "react";
import { PenLine, BookOpen, LogOut } from "lucide-react";
import CreateStoryTab from "./components/CreateStoryTab";
import StoryViewer from "./components/StoryViewer";
import Library from "./components/Library";
import { Story } from "./types/story";
import { getStories } from "./lib/storage";
import { useAuth } from "./lib/supabase/auth-context";

type View = "create" | "library";

export default function Home() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<View>("create");
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  useEffect(() => {
    setStories(getStories());
  }, []);

  const handleStoryCreated = (story: Story) => {
    setStories((prev) => [story, ...prev]);
    setActiveStory(story);
  };

  const handleStoryUpdate = (updated: Story) => {
    setStories((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    setActiveStory(updated);
  };

  const handleStoryDelete = (id: string) => {
    setStories((prev) => prev.filter((s) => s.id !== id));
    setActiveStory(null);
  };

  // Story viewer mode
  if (activeStory) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-8">
        <StoryViewer
          story={activeStory}
          onBack={() => setActiveStory(null)}
          onUpdate={handleStoryUpdate}
          onDelete={handleStoryDelete}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              AI Fanfiction Generator
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Unlimited personalised stories in your favourite universes
            </p>
          </div>
          {user && (
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          )}
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="border-b border-zinc-800 px-4">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setView("create")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === "create"
                ? "border-purple-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <PenLine className="w-4 h-4" />
            New Story
          </button>
          <button
            onClick={() => setView("library")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === "library"
                ? "border-purple-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Library
            {stories.length > 0 && (
              <span className="bg-zinc-800 text-zinc-300 text-xs px-1.5 py-0.5 rounded-full">
                {stories.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="px-4 py-8">
        {view === "create" ? (
          <CreateStoryTab onStoryCreated={handleStoryCreated} />
        ) : (
          <Library stories={stories} onSelectStory={setActiveStory} />
        )}
      </div>
    </main>
  );
}
