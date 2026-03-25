"use client";

import { useState } from "react";
import { TROPE_CATEGORIES } from "../lib/fandoms";

interface TropeSelectorProps {
  selected: string[];
  onChange: (tropes: string[]) => void;
}

export default function TropeSelector({ selected, onChange }: TropeSelectorProps) {
  const [activeTab, setActiveTab] = useState(TROPE_CATEGORIES[0].id);

  const toggle = (trope: string) => {
    if (selected.includes(trope)) {
      onChange(selected.filter((t) => t !== trope));
    } else if (selected.length < 6) {
      onChange([...selected, trope]);
    }
  };

  const activeCategory = TROPE_CATEGORIES.find((c) => c.id === activeTab)!;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-300">
        Tropes{" "}
        <span className="text-zinc-500">
          (optional, max 6 — {selected.length}/6 selected)
        </span>
      </label>

      <div className="flex gap-1 border-b border-zinc-800">
        {TROPE_CATEGORIES.map((cat) => {
          const count = selected.filter((t) => cat.tropes.includes(t)).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 min-h-[44px] ${
                activeTab === cat.id
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {cat.label}
              {count > 0 && (
                <span className="ml-1 text-xs bg-rose-600 text-white px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {activeCategory.tropes.map((trope) => (
          <button
            key={trope}
            type="button"
            onClick={() => toggle(trope)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors min-h-[44px] ${
              selected.includes(trope)
                ? "bg-rose-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {trope}
          </button>
        ))}
      </div>
    </div>
  );
}
