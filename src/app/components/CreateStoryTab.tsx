"use client";

import { useState, useCallback } from "react";
import { v4 as uuid } from "uuid";
import { Sparkles, Loader2 } from "lucide-react";
import FandomSelector from "./FandomSelector";
import CharacterSelector from "./CharacterSelector";
import RelationshipSelector from "./RelationshipSelector";
import RatingSelector from "./RatingSelector";
import ToneSelector from "./ToneSelector";
import TropeSelector from "./TropeSelector";
import { Story, StoryFormData, GenerateResponse, RelationshipType, Rating } from "../types/story";
import { getFandomById } from "../lib/fandoms";
import { saveStory } from "../lib/storage";

interface CreateStoryTabProps {
  onStoryCreated: (story: Story) => void;
}

export default function CreateStoryTab({ onStoryCreated }: CreateStoryTabProps) {
  const [fandom, setFandom] = useState("");
  const [customFandom, setCustomFandom] = useState("");
  const [characters, setCharacters] = useState<string[]>(["", "", "", ""]);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("gen");
  const [rating, setRating] = useState<Rating>("mature");
  const [setting, setSetting] = useState("");
  const [tone, setTone] = useState<string[]>([]);
  const [tropes, setTropes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // At least 2 characters filled in, at least 1 tone
  const filledCharacters = characters.filter((c) => c.trim().length >= 2);
  const canSubmit = filledCharacters.length >= 2 && tone.length >= 1 && !loading;

  const handleFandomChange = useCallback((id: string) => {
    setFandom(id);
    // Reset characters when fandom changes
    setCharacters(["", "", "", ""]);
  }, []);

  const fandomData = getFandomById(fandom);
  const settingPlaceholder = fandomData?.settingPlaceholder || "Describe your setting...";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    const formData: StoryFormData = {
      fandom: fandom === "custom" ? "" : fandom,
      customFandom: fandom === "custom" ? customFandom : undefined,
      characters: characters.filter((c) => c.trim().length > 0),
      relationshipType,
      rating,
      setting: setting.trim() || undefined,
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
        ...formData,
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
        onSelect={handleFandomChange}
        onCustomChange={setCustomFandom}
      />

      <CharacterSelector
        fandom={fandom}
        characters={characters}
        onChange={setCharacters}
      />

      <RelationshipSelector
        selected={relationshipType}
        onChange={setRelationshipType}
      />

      <RatingSelector selected={rating} onChange={setRating} />

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Setting <span className="text-zinc-500">(optional)</span>
        </label>
        <input
          type="text"
          value={setting}
          onChange={(e) => setSetting(e.target.value)}
          placeholder={settingPlaceholder}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      <ToneSelector selected={tone} onChange={setTone} />

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
