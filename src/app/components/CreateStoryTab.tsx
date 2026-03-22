"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { Sparkles, Loader2 } from "lucide-react";
import FandomSelector from "./FandomSelector";
import TropeSelector from "./TropeSelector";
import { Story, StoryFormData, GenerateResponse } from "../types/story";
import { saveStory } from "../lib/storage";

interface CreateStoryTabProps {
  onStoryCreated: (story: Story) => void;
}

export default function CreateStoryTab({ onStoryCreated }: CreateStoryTabProps) {
  const [fandom, setFandom] = useState("");
  const [customFandom, setCustomFandom] = useState("");
  const [characters, setCharacters] = useState("");
  const [setting, setSetting] = useState("");
  const [plotTheme, setPlotTheme] = useState("");
  const [tone, setTone] = useState("");
  const [tropes, setTropes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    characters.length >= 3 &&
    setting.length >= 5 &&
    plotTheme.length >= 3 &&
    tone.length >= 3 &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    const formData: StoryFormData = {
      fandom: fandom === "custom" ? "" : fandom,
      customFandom: fandom === "custom" ? customFandom : undefined,
      characters,
      setting,
      plotTheme,
      tone,
      tropes,
    };

    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate story");
      }

      const data: GenerateResponse = await res.json();
      const wordCount = data.chapter.split(/\s+/).length;

      const story: Story = {
        id: uuid(),
        title: data.title,
        chapters: [data.chapter],
        fandom: formData.fandom,
        customFandom: formData.customFandom,
        characters,
        setting,
        plotTheme,
        tone,
        tropes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount,
      };

      saveStory(story);
      onStoryCreated(story);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <FandomSelector
        selected={fandom}
        customFandom={customFandom}
        onSelect={setFandom}
        onCustomChange={setCustomFandom}
      />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Characters *
          </label>
          <input
            type="text"
            value={characters}
            onChange={(e) => setCharacters(e.target.value)}
            placeholder="e.g., Hermione and Draco, or describe your own characters"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Setting *
          </label>
          <input
            type="text"
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            placeholder="e.g., Hogwarts library after hours, 6th year"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Theme *
          </label>
          <input
            type="text"
            value={plotTheme}
            onChange={(e) => setPlotTheme(e.target.value)}
            placeholder="e.g., Dark romance with mystery elements"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Tone *
          </label>
          <input
            type="text"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="e.g., Intense and seductive, or dark and suspenseful"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <TropeSelector selected={tropes} onChange={setTropes} />

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-purple-600 hover:bg-purple-500 active:bg-purple-700"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Crafting your story...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Start My Story
          </>
        )}
      </button>
    </div>
  );
}
