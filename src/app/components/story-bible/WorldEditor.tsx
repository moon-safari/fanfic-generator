"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { BibleWorldContent } from "../../types/bible";

interface WorldEditorProps {
  content: BibleWorldContent | null;
  onSave: (content: BibleWorldContent) => void;
}

function TagChips({
  items,
  onRemove,
  onAdd,
  placeholder,
}: {
  items: string[];
  onRemove: (idx: number) => void;
  onAdd: (val: string) => void;
  placeholder: string;
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
            className="inline-flex items-center gap-1 bg-purple-900/40 text-purple-300 text-xs px-2 py-1 rounded-full"
          >
            {item}
            <button
              onClick={() => onRemove(i)}
              className="hover:text-purple-100 transition-colors"
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

export default function WorldEditor({ content, onSave }: WorldEditorProps) {
  const data: BibleWorldContent = content ?? {
    setting: "",
    rules: [],
    locations: [],
    era: "",
    customs: "",
  };

  const update = (partial: Partial<BibleWorldContent>) => {
    onSave({ ...data, ...partial });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Setting</label>
        <input
          type="text"
          value={data.setting}
          onChange={(e) => update({ setting: e.target.value })}
          placeholder="Where the story takes place..."
          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Era / Time Period</label>
        <input
          type="text"
          value={data.era}
          onChange={(e) => update({ era: e.target.value })}
          placeholder="When the story takes place..."
          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Customs</label>
        <textarea
          value={data.customs}
          onChange={(e) => update({ customs: e.target.value })}
          placeholder="Cultural norms, traditions..."
          rows={2}
          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1 block">
          World Rules (type + Enter)
        </label>
        <TagChips
          items={data.rules}
          onAdd={(v) => update({ rules: [...data.rules, v] })}
          onRemove={(i) =>
            update({ rules: data.rules.filter((_, idx) => idx !== i) })
          }
          placeholder="Add a world rule..."
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1 block">
          Locations (type + Enter)
        </label>
        <TagChips
          items={data.locations}
          onAdd={(v) => update({ locations: [...data.locations, v] })}
          onRemove={(i) =>
            update({
              locations: data.locations.filter((_, idx) => idx !== i),
            })
          }
          placeholder="Add a location..."
        />
      </div>
    </div>
  );
}
