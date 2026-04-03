"use client";

import { TONES } from "../lib/fandoms";
import type { ToneOption } from "../types/fandom";

interface ToneSelectorProps {
  selected: string[];
  onChange: (tones: string[]) => void;
  options?: ToneOption[];
  label?: string;
  showLabel?: boolean;
}

export default function ToneSelector({
  selected,
  onChange,
  options = TONES,
  label = "Tone",
  showLabel = true,
}: ToneSelectorProps) {
  const toggle = (toneLabel: string) => {
    if (selected.includes(toneLabel)) {
      onChange(selected.filter((t) => t !== toneLabel));
    } else if (selected.length < 2) {
      onChange([...selected, toneLabel]);
    }
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="block text-sm font-medium text-zinc-300">
          {label} <span className="text-zinc-500">(pick up to 2)</span>
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((tone) => (
          <button
            key={tone.id}
            type="button"
            onClick={() => toggle(tone.label)}
            className={`flex flex-col items-start px-3 py-2 rounded-lg text-sm transition-colors min-h-[44px] ${
              selected.includes(tone.label)
                ? "bg-rose-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            <span className="font-medium">{tone.label}</span>
            <span className={`text-xs ${selected.includes(tone.label) ? "text-rose-200" : "text-zinc-500"}`}>
              {tone.subtitle}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
