"use client";

import { BibleNotesContent } from "../../types/bible";

interface NotesEditorProps {
  content: BibleNotesContent | null;
  onSave: (content: BibleNotesContent) => void;
}

export default function NotesEditor({ content, onSave }: NotesEditorProps) {
  return (
    <textarea
      value={content?.text ?? ""}
      onChange={(e) => onSave({ text: e.target.value })}
      placeholder="Freeform notes, ideas, research..."
      rows={8}
      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-y min-h-[120px]"
    />
  );
}
