"use client";

import { useState, useEffect, useRef } from "react";
import { getFandomById } from "../lib/fandoms";

interface CharacterSelectorProps {
  fandom: string;
  characters: string[];
  onChange: (characters: string[]) => void;
}

export default function CharacterSelector({ fandom, characters, onChange }: CharacterSelectorProps) {
  const fandomData = getFandomById(fandom);
  const fandomCharacters = fandomData?.characters ?? [];

  const updateCharacter = (index: number, value: string) => {
    const next = [...characters];
    next[index] = value;
    onChange(next);
  };

  const labels = [
    "Character 1 (required)",
    "Character 2 (required)",
    "Character 3 (optional)",
    "Character 4 (optional)",
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-300">Characters</label>
      {labels.map((label, i) => (
        <div key={i}>
          <label className="block text-xs text-zinc-500 mb-1">{label}</label>
          <ComboInput
            value={characters[i] || ""}
            onChange={(val) => updateCharacter(i, val)}
            suggestions={fandomCharacters}
            placeholder="Type character name..."
          />
        </div>
      ))}
    </div>
  );
}

interface ComboInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder: string;
}

function ComboInput({ value, onChange, suggestions, placeholder }: ComboInputProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value.length > 0
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions;

  // Show dropdown when focused and there are suggestions to show
  const showDropdown = focused && filtered.length > 0 && open;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setFocused(true);
          setOpen(true);
        }}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-purple-500"
      />
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg">
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(name);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors ${
                value === name ? "text-purple-400" : "text-zinc-300"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
