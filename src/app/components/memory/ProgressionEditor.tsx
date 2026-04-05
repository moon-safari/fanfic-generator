"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { MemoryCustomField, MemoryEntry, MemoryProgression } from "../../types/memory";
import CustomFieldEditor from "./CustomFieldEditor";

interface ProgressionEditorProps {
  entry: MemoryEntry;
  currentChapter: number;
  contentUnitLabel?: string;
  saving?: boolean;
  onCreate: (input: {
    chapterNumber: number;
    fieldOverrides?: Record<string, string>;
    descriptionOverride?: string | null;
    notes?: string | null;
  }) => Promise<void>;
  onUpdate: (
    progressionId: string,
    input: {
      chapterNumber?: number;
      fieldOverrides?: Record<string, string>;
      descriptionOverride?: string | null;
      notes?: string | null;
    }
  ) => Promise<void>;
  onDelete: (progressionId: string) => Promise<void>;
}

interface ProgressionDraft {
  chapterNumber: string;
  descriptionOverride: string;
  notes: string;
  fieldOverrides: MemoryCustomField[];
}

export default function ProgressionEditor({
  entry,
  currentChapter,
  contentUnitLabel = "Chapter",
  saving = false,
  onCreate,
  onUpdate,
  onDelete,
}: ProgressionEditorProps) {
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState<ProgressionDraft>(createEmptyDraft(currentChapter));

  const sortedProgressions = useMemo(
    () => [...entry.progressions].sort((a, b) => a.chapterNumber - b.chapterNumber),
    [entry.progressions]
  );

  const handleCreate = async () => {
    const parsed = parseDraft(newDraft);
    if (!parsed) {
      return;
    }

    await onCreate(parsed);
    setNewDraft(createEmptyDraft(currentChapter));
    setCreating(false);
  };

  const toggleCreating = () => {
    const next = !creating;
    setCreating(next);

    if (next) {
      setNewDraft(createEmptyDraft(currentChapter));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Progressions
        </p>
        <button
          type="button"
          onClick={toggleCreating}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          {creating ? "Cancel" : "Add progression"}
        </button>
      </div>

      {sortedProgressions.length === 0 && !creating ? (
        <div className="rounded-xl border border-dashed border-zinc-800 px-3 py-3 text-xs text-zinc-500">
          No {contentUnitLabel.toLowerCase()}-based changes yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedProgressions.map((progression) => (
            <EditableProgressionCard
              key={progression.id}
              progression={progression}
              contentUnitLabel={contentUnitLabel}
              saving={saving}
              onSave={(input) => onUpdate(progression.id, input)}
              onDelete={() => onDelete(progression.id)}
            />
          ))}

          {creating && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
              <ProgressionFields draft={newDraft} onChange={setNewDraft} contentUnitLabel={contentUnitLabel} />
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void handleCreate();
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  Add progression
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setNewDraft(createEmptyDraft(currentChapter));
                  }}
                  className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EditableProgressionCard({
  progression,
  contentUnitLabel = "Chapter",
  saving,
  onSave,
  onDelete,
}: {
  progression: MemoryProgression;
  contentUnitLabel?: string;
  saving: boolean;
  onSave: (input: {
    chapterNumber?: number;
    fieldOverrides?: Record<string, string>;
    descriptionOverride?: string | null;
    notes?: string | null;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<ProgressionDraft>(() => toDraft(progression));

  useEffect(() => {
    setDraft(toDraft(progression));
  }, [progression]);

  const handleSave = async () => {
    const parsed = parseDraft(draft);
    if (!parsed) {
      return;
    }

    await onSave(parsed);
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">{contentUnitLabel} {progression.chapterNumber}</p>
          <p className="text-xs text-zinc-500">Layered change on top of the base entry.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void onDelete();
          }}
          className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:border-red-500 hover:text-red-300"
          aria-label="Delete progression"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <ProgressionFields draft={draft} onChange={setDraft} contentUnitLabel={contentUnitLabel} />

      <div className="mt-3">
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          Save progression
        </button>
      </div>
    </div>
  );
}

function ProgressionFields({
  draft,
  onChange,
  contentUnitLabel = "Chapter",
}: {
  draft: ProgressionDraft;
  onChange: (draft: ProgressionDraft) => void;
  contentUnitLabel?: string;
}) {
  return (
    <div className="space-y-3">
      <label className="space-y-1.5">
        <span className="text-xs font-medium text-zinc-400">{contentUnitLabel} number</span>
        <input
          value={draft.chapterNumber}
          onChange={(event) =>
            onChange({ ...draft, chapterNumber: event.target.value })
          }
          inputMode="numeric"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-purple-500"
        />
      </label>

      <label className="space-y-1.5">
        <span className="text-xs font-medium text-zinc-400">Description override</span>
        <textarea
          value={draft.descriptionOverride}
          onChange={(event) =>
            onChange({ ...draft, descriptionOverride: event.target.value })
          }
          rows={3}
          placeholder={`What changed about this entry in this ${contentUnitLabel.toLowerCase()}?`}
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
        />
      </label>

      <label className="space-y-1.5">
        <span className="text-xs font-medium text-zinc-400">Notes</span>
        <textarea
          value={draft.notes}
          onChange={(event) => onChange({ ...draft, notes: event.target.value })}
          rows={2}
          placeholder="Optional reminder for why the change matters."
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
        />
      </label>

      <CustomFieldEditor
        fields={draft.fieldOverrides}
        onChange={(fields) => onChange({ ...draft, fieldOverrides: fields })}
        label="Field overrides"
        keyPlaceholder="status"
        valuePlaceholder="Now a fugitive"
        addLabel="Add override"
      />
    </div>
  );
}

function toDraft(progression: MemoryProgression): ProgressionDraft {
  return {
    chapterNumber: String(progression.chapterNumber),
    descriptionOverride: progression.descriptionOverride ?? "",
    notes: progression.notes ?? "",
    fieldOverrides: Object.entries(progression.fieldOverrides ?? {}).map(([key, value]) => ({
      key,
      value,
    })),
  };
}

function createEmptyDraft(currentChapter: number): ProgressionDraft {
  return {
    chapterNumber: String(currentChapter),
    descriptionOverride: "",
    notes: "",
    fieldOverrides: [],
  };
}

function parseDraft(
  draft: ProgressionDraft
):
  | {
      chapterNumber: number;
      fieldOverrides?: Record<string, string>;
      descriptionOverride?: string | null;
      notes?: string | null;
    }
  | null {
  const chapterNumber = Number.parseInt(draft.chapterNumber, 10);
  if (Number.isNaN(chapterNumber) || chapterNumber <= 0) {
    return null;
  }

  const fieldOverrides = Object.fromEntries(
    draft.fieldOverrides
      .map((field) => [field.key.trim(), field.value.trim()] as const)
      .filter(([key]) => key.length > 0)
  );

  return {
    chapterNumber,
    fieldOverrides,
    descriptionOverride: draft.descriptionOverride.trim() || null,
    notes: draft.notes.trim() || null,
  };
}
