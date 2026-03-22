"use client";

import { TROPES } from "../lib/fandoms";

interface TropeSelectorProps {
  selected: string[];
  onChange: (tropes: string[]) => void;
}

export default function TropeSelector({
  selected,
  onChange,
}: TropeSelectorProps) {
  const toggle = (trope: string) => {
    if (selected.includes(trope)) {
      onChange(selected.filter((t) => t !== trope));
    } else if (selected.length < 6) {
      onChange([...selected, trope]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">
        Tropes <span className="text-zinc-500">(optional, max 6)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {TROPES.map((trope) => (
          <button
            key={trope}
            type="button"
            onClick={() => toggle(trope)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
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
