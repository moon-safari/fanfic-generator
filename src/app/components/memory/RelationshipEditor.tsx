"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { MemoryEntry, MemoryRelationship } from "../../types/memory";

interface RelationshipEditorProps {
  entry: MemoryEntry;
  entries: MemoryEntry[];
  relationships: MemoryRelationship[];
  saving?: boolean;
  onSelectEntry?: (entryId: string) => void;
  onCreate: (input: {
    sourceEntryId: string;
    targetEntryId: string;
    forwardLabel?: string;
    reverseLabel?: string;
  }) => Promise<void>;
  onDelete: (relationshipId: string) => Promise<void>;
}

export default function RelationshipEditor({
  entry,
  entries,
  relationships,
  saving = false,
  onSelectEntry,
  onCreate,
  onDelete,
}: RelationshipEditorProps) {
  const [targetEntryId, setTargetEntryId] = useState("");
  const [forwardLabel, setForwardLabel] = useState("");
  const [reverseLabel, setReverseLabel] = useState("");

  const relatedRelationships = useMemo(
    () =>
      relationships.filter(
        (relationship) =>
          relationship.sourceEntryId === entry.id || relationship.targetEntryId === entry.id
      ),
    [entry.id, relationships]
  );

  const availableTargets = useMemo(
    () => entries.filter((candidate) => candidate.id !== entry.id),
    [entries, entry.id]
  );

  const handleCreate = async () => {
    if (!targetEntryId) {
      return;
    }

    await onCreate({
      sourceEntryId: entry.id,
      targetEntryId,
      forwardLabel: forwardLabel.trim(),
      reverseLabel: reverseLabel.trim(),
    });

    setTargetEntryId("");
    setForwardLabel("");
    setReverseLabel("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Relationships
        </p>
        <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400">
          {relatedRelationships.length}
        </span>
      </div>

      <div className="space-y-2">
        {relatedRelationships.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 px-3 py-3 text-xs text-zinc-500">
            No relationships yet.
          </div>
        ) : (
          relatedRelationships.map((relationship) => {
            const isSource = relationship.sourceEntryId === entry.id;
            const otherEntry = entries.find((candidate) =>
              isSource
                ? candidate.id === relationship.targetEntryId
                : candidate.id === relationship.sourceEntryId
            );
            const label = isSource
              ? relationship.forwardLabel || "related to"
              : relationship.reverseLabel || "related to";

            return (
              <div
                key={relationship.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm text-white">
                    <span className="font-medium">{label}</span>{" "}
                    {otherEntry && onSelectEntry ? (
                      <button
                        type="button"
                        onClick={() => onSelectEntry(otherEntry.id)}
                        className="text-zinc-300 underline decoration-transparent underline-offset-4 transition-colors hover:text-white hover:decoration-zinc-500"
                      >
                        {otherEntry.name}
                      </button>
                    ) : (
                      <span className="text-zinc-300">
                        {otherEntry?.name ?? "Unknown entry"}
                      </span>
                    )}
                  </p>
                  {(relationship.forwardLabel || relationship.reverseLabel) && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {relationship.forwardLabel || "related to"} /{" "}
                      {relationship.reverseLabel || "related to"}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void onDelete(relationship.id);
                  }}
                  className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition-colors hover:border-red-500 hover:text-red-300"
                  aria-label="Delete relationship"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
        <div className="grid grid-cols-1 gap-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-400">Target entry</span>
            <select
              value={targetEntryId}
              onChange={(event) => setTargetEntryId(event.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-purple-500"
            >
              <option value="">Choose an entry</option>
              {availableTargets.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Forward label</span>
              <input
                value={forwardLabel}
                onChange={(event) => setForwardLabel(event.target.value)}
                placeholder="mentors"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Reverse label</span>
              <input
                value={reverseLabel}
                onChange={(event) => setReverseLabel(event.target.value)}
                placeholder="mentored by"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              void handleCreate();
            }}
            disabled={!targetEntryId || saving}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Add relationship
          </button>
        </div>
      </div>
    </div>
  );
}
