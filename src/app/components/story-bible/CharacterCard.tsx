"use client";

import { useState } from "react";
import { Plus, X, User } from "lucide-react";
import { BibleCharacter, BibleCharactersContent } from "../../types/bible";

interface CharacterCardProps {
  content: BibleCharactersContent | null;
  onSave: (content: BibleCharactersContent) => void;
}

const ROLE_OPTIONS = [
  "protagonist",
  "antagonist",
  "love interest",
  "mentor",
  "sidekick",
  "supporting",
  "minor",
];

function emptyCharacter(): BibleCharacter {
  return {
    name: "",
    role: "supporting",
    personality: "",
    appearance: "",
    relationships: [],
    voiceNotes: "",
  };
}

function SingleCharacterCard({
  character,
  onChange,
  onRemove,
}: {
  character: BibleCharacter;
  onChange: (c: BibleCharacter) => void;
  onRemove: () => void;
}) {
  const update = (field: keyof BibleCharacter, value: string) => {
    onChange({ ...character, [field]: value });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <User className="w-4 h-4 text-purple-400 shrink-0" />
          <input
            type="text"
            value={character.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Character name"
            className="flex-1 bg-transparent border-b border-zinc-700 text-white text-sm font-medium focus:outline-none focus:border-purple-500 pb-0.5 min-w-0"
          />
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-zinc-500 hover:text-red-400 transition-colors shrink-0"
          aria-label="Remove character"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <select
        value={character.role}
        onChange={(e) => update("role", e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
      >
        {ROLE_OPTIONS.map((r) => (
          <option key={r} value={r}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </option>
        ))}
      </select>

      <textarea
        value={character.personality}
        onChange={(e) => update("personality", e.target.value)}
        placeholder="Personality traits..."
        rows={2}
        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
      />

      <textarea
        value={character.appearance}
        onChange={(e) => update("appearance", e.target.value)}
        placeholder="Appearance..."
        rows={2}
        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
      />

      <textarea
        value={character.voiceNotes}
        onChange={(e) => update("voiceNotes", e.target.value)}
        placeholder="Voice/dialogue notes..."
        rows={2}
        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
      />
    </div>
  );
}

export default function CharacterCard({
  content,
  onSave,
}: CharacterCardProps) {
  const characters = content?.characters ?? [];

  const handleChange = (idx: number, updated: BibleCharacter) => {
    const next = [...characters];
    next[idx] = updated;
    onSave({ characters: next });
  };

  const handleRemove = (idx: number) => {
    const next = characters.filter((_, i) => i !== idx);
    onSave({ characters: next });
  };

  const handleAdd = () => {
    onSave({ characters: [...characters, emptyCharacter()] });
  };

  return (
    <div className="space-y-3">
      {characters.map((char, i) => (
        <SingleCharacterCard
          key={i}
          character={char}
          onChange={(c) => handleChange(i, c)}
          onRemove={() => handleRemove(i)}
        />
      ))}

      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-purple-700/50 rounded-xl text-sm text-purple-400 hover:bg-purple-900/20 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Character
      </button>
    </div>
  );
}
