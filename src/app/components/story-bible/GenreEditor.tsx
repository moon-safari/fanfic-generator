"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { BibleGenreContent } from "../../types/bible";

interface GenreEditorProps {
  content: BibleGenreContent | null;
  onSave: (content: BibleGenreContent) => void;
}

function TagInput({
  items,
  onAdd,
  onRemove,
  placeholder,
  chipClass,
}: {
  items: string[];
  onAdd: (val: string) => void;
  onRemove: (idx: number) => void;
  placeholder: string;
  chipClass?: string;
}) {
  const [input, setInput] = useState("");

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput("");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              chipClass ?? "bg-purple-900/40 text-purple-300"
            }`}
          >
            {item}
            <button
              onClick={() => onRemove(i)}
              className="hover:opacity-70 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
      />
    </div>
  );
}

export default function GenreEditor({ content, onSave }: GenreEditorProps) {
  const data: BibleGenreContent = content ?? {
    primary: "",
    secondary: [],
    warnings: [],
  };

  const update = (partial: Partial<BibleGenreContent>) => {
    onSave({ ...data, ...partial });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Primary Genre</label>
        <input
          type="text"
          value={data.primary}
          onChange={(e) => update({ primary: e.target.value })}
          placeholder="e.g. Romance, Fantasy, Horror..."
          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1 block">
          Secondary Genres (type + Enter)
        </label>
        <TagInput
          items={data.secondary}
          onAdd={(v) => update({ secondary: [...data.secondary, v] })}
          onRemove={(i) =>
            update({
              secondary: data.secondary.filter((_, idx) => idx !== i),
            })
          }
          placeholder="Add a genre..."
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1 block">
          Content Warnings (type + Enter)
        </label>
        <TagInput
          items={data.warnings}
          onAdd={(v) => update({ warnings: [...data.warnings, v] })}
          onRemove={(i) =>
            update({
              warnings: data.warnings.filter((_, idx) => idx !== i),
            })
          }
          placeholder="Add a warning..."
          chipClass="bg-red-900/40 text-red-300"
        />
      </div>
    </div>
  );
}
