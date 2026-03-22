"use client";

import { FANDOM_CATEGORIES } from "../lib/fandoms";

interface FandomSelectorProps {
  selected: string;
  customFandom: string;
  onSelect: (id: string) => void;
  onCustomChange: (value: string) => void;
}

export default function FandomSelector({
  selected,
  customFandom,
  onSelect,
  onCustomChange,
}: FandomSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-zinc-300">
        Choose a Universe
      </label>

      <div className="space-y-3">
        {FANDOM_CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              {cat.emoji} {cat.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {cat.fandoms.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSelect(f.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selected === f.id
                      ? "bg-purple-600 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => onSelect("custom")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            selected === "custom"
              ? "bg-purple-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Custom
        </button>
        <button
          type="button"
          onClick={() => onSelect("")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            selected === ""
              ? "bg-purple-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Original Story
        </button>
      </div>

      {selected === "custom" && (
        <input
          type="text"
          value={customFandom}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="Enter your fandom (e.g., Twilight, One Piece...)"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
        />
      )}
    </div>
  );
}
