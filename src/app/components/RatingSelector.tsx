"use client";

import { Rating } from "../types/story";

const RATINGS: { value: Rating; label: string }[] = [
  { value: "general", label: "General" },
  { value: "teen", label: "Teen" },
  { value: "mature", label: "Mature" },
  { value: "explicit", label: "Explicit" },
];

interface RatingSelectorProps {
  selected: Rating;
  onChange: (rating: Rating) => void;
}

export default function RatingSelector({ selected, onChange }: RatingSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">Rating</label>
      <div className="flex flex-wrap gap-2">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selected === r.value
                ? "bg-purple-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
