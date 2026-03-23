"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const isSearching = search.length >= 2;

  const filteredCategories = useMemo(() => {
    if (!isSearching) return FANDOM_CATEGORIES;
    const q = search.toLowerCase();
    return FANDOM_CATEGORIES.map((cat) => ({
      ...cat,
      fandoms: cat.fandoms.filter((f) => f.name.toLowerCase().includes(q)),
    })).filter((cat) => cat.fandoms.length > 0);
  }, [search, isSearching]);

  const toggleCategory = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Find which category the selected fandom belongs to
  const selectedCategory = FANDOM_CATEGORIES.find((cat) =>
    cat.fandoms.some((f) => f.id === selected)
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-300">
        Choose a Universe
      </label>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search fandoms..."
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-purple-500"
      />

      <div className="max-h-80 overflow-y-auto space-y-1 rounded-lg">
        {filteredCategories.map((cat) => {
          const isExpanded = isSearching || expandedCats.has(cat.id) || selectedCategory?.id === cat.id;

          return (
            <div key={cat.id} className="border border-zinc-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
              >
                <span>
                  {cat.emoji} {cat.label}
                  <span className="ml-1 text-xs text-zinc-600">({cat.fandoms.length})</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded && (
                <div className="flex flex-wrap gap-1.5 px-3 pb-3">
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
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-1">
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
