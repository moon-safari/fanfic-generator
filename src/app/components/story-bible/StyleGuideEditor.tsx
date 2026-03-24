"use client";

import { BibleStyleGuideContent } from "../../types/bible";

interface StyleGuideEditorProps {
  content: BibleStyleGuideContent | null;
  onSave: (content: BibleStyleGuideContent) => void;
}

const POV_OPTIONS = [
  "First person",
  "Second person",
  "Third person limited",
  "Third person omniscient",
  "Multiple POV",
];

const TENSE_OPTIONS = ["Past tense", "Present tense", "Mixed"];

export default function StyleGuideEditor({
  content,
  onSave,
}: StyleGuideEditorProps) {
  const data: BibleStyleGuideContent = content ?? {
    pov: "",
    tense: "",
    proseStyle: "",
    dialogueStyle: "",
    pacing: "",
  };

  const update = (partial: Partial<BibleStyleGuideContent>) => {
    onSave({ ...data, ...partial });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">
          Point of View
        </label>
        <select
          value={data.pov}
          onChange={(e) => update({ pov: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
        >
          <option value="">Select POV...</option>
          {POV_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Tense</label>
        <select
          value={data.tense}
          onChange={(e) => update({ tense: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
        >
          <option value="">Select tense...</option>
          {TENSE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Prose Style</label>
        <input
          type="text"
          value={data.proseStyle}
          onChange={(e) => update({ proseStyle: e.target.value })}
          placeholder="e.g. lyrical, sparse, descriptive..."
          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1 block">
          Dialogue Style
        </label>
        <input
          type="text"
          value={data.dialogueStyle}
          onChange={(e) => update({ dialogueStyle: e.target.value })}
          placeholder="e.g. witty banter, formal, naturalistic..."
          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Pacing</label>
        <input
          type="text"
          value={data.pacing}
          onChange={(e) => update({ pacing: e.target.value })}
          placeholder="e.g. slow burn, fast-paced, episodic..."
          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
        />
      </div>
    </div>
  );
}
