"use client";

import { RelationshipType } from "../types/story";

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: "gen", label: "Gen" },
  { value: "mm", label: "M/M" },
  { value: "fm", label: "F/M" },
  { value: "ff", label: "F/F" },
  { value: "multi", label: "Multi" },
  { value: "other", label: "Other" },
];

interface RelationshipSelectorProps {
  selected: RelationshipType;
  onChange: (type: RelationshipType) => void;
}

export default function RelationshipSelector({ selected, onChange }: RelationshipSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">Relationship</label>
      <div className="flex flex-wrap gap-2">
        {RELATIONSHIP_TYPES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
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
