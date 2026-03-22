"use client";

import { useState, useEffect } from "react";
import { getFandomById } from "../lib/fandoms";

interface CharacterSelectorProps {
  fandom: string;
  characters: string[];
  onChange: (characters: string[]) => void;
}

export default function CharacterSelector({ fandom, characters, onChange }: CharacterSelectorProps) {
  const [customInputs, setCustomInputs] = useState<Record<number, boolean>>({});

  // Reset custom input toggles when fandom changes
  useEffect(() => {
    setCustomInputs({});
  }, [fandom]);

  const fandomData = getFandomById(fandom);
  const fandomCharacters = fandomData?.characters ?? [];
  const isCustomFandom = !fandomData; // custom or original — no dropdown

  const updateCharacter = (index: number, value: string) => {
    const next = [...characters];
    next[index] = value;
    onChange(next);
  };

  const toggleCustom = (index: number) => {
    setCustomInputs((prev) => ({ ...prev, [index]: !prev[index] }));
    updateCharacter(index, "");
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
      {labels.map((label, i) => {
        const useCustom = isCustomFandom || customInputs[i];

        return (
          <div key={i}>
            <label className="block text-xs text-zinc-500 mb-1">{label}</label>
            {useCustom ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={characters[i] || ""}
                  onChange={(e) => updateCharacter(i, e.target.value)}
                  placeholder="Type character name..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
                {!isCustomFandom && (
                  <button
                    type="button"
                    onClick={() => toggleCustom(i)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 px-2"
                  >
                    List
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={characters[i] || ""}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      toggleCustom(i);
                    } else {
                      updateCharacter(i, e.target.value);
                    }
                  }}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select character...</option>
                  {fandomCharacters.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="__custom__">Custom...</option>
                </select>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
