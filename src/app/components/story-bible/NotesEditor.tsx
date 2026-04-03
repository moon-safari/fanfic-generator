"use client";

import { Plus, Trash2 } from "lucide-react";
import { normalizeNotesContent } from "../../lib/planning";
import { getProjectUnitLabel } from "../../lib/projectMode";
import type { ProjectMode } from "../../types/story";
import type {
  BibleNotesContent,
  BiblePlanningArc,
  BiblePlanningThread,
} from "../../types/bible";

interface NotesEditorProps {
  content: BibleNotesContent | null;
  onSave: (content: BibleNotesContent) => void;
  projectMode?: ProjectMode;
}

const ARC_STATUS_OPTIONS: Array<BiblePlanningArc["status"]> = [
  "planned",
  "active",
  "landed",
];

const THREAD_STATUS_OPTIONS: Array<BiblePlanningThread["status"]> = [
  "open",
  "building",
  "resolved",
];

export default function NotesEditor({
  content,
  onSave,
  projectMode = "fiction",
}: NotesEditorProps) {
  const notes = normalizeNotesContent(content);
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });

  const updateNotes = (partial: Partial<BibleNotesContent>) => {
    onSave({
      ...notes,
      ...partial,
    });
  };

  const updateArc = (id: string, partial: Partial<BiblePlanningArc>) => {
    updateNotes({
      arcs: notes.arcs.map((arc) =>
        arc.id === id ? { ...arc, ...partial } : arc
      ),
    });
  };

  const removeArc = (id: string) => {
    updateNotes({
      arcs: notes.arcs.filter((arc) => arc.id !== id),
    });
  };

  const addArc = () => {
    updateNotes({
      arcs: [...notes.arcs, createEmptyArc()],
    });
  };

  const updateThread = (
    id: string,
    partial: Partial<BiblePlanningThread>
  ) => {
    updateNotes({
      threads: notes.threads.map((thread) =>
        thread.id === id ? { ...thread, ...partial } : thread
      ),
    });
  };

  const removeThread = (id: string) => {
    updateNotes({
      threads: notes.threads.filter((thread) => thread.id !== id),
    });
  };

  const addThread = () => {
    updateNotes({
      threads: [...notes.threads, createEmptyThread()],
    });
  };

  return (
    <div className="space-y-5">
      <section className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Project Notes
        </label>
        <textarea
          value={notes.text}
          onChange={(event) => updateNotes({ text: event.target.value })}
          placeholder="Capture research, reminders, editorial constraints, or planning context..."
          rows={5}
          className="w-full resize-y rounded-2xl border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-300 placeholder-zinc-600 focus:border-purple-500 focus:outline-none min-h-[140px]"
        />
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Arc Tracker</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Track the bigger throughlines this project is building toward.
            </p>
          </div>
          <button
            type="button"
            onClick={addArc}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-purple-700/50 px-3 py-1.5 text-xs text-purple-300 transition-colors hover:bg-purple-900/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Add arc
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {notes.arcs.length === 0 ? (
            <EmptyPlanningState
              title="No arcs yet"
              description="Add the major threads of movement, transformation, or payoff you want the project to carry."
            />
          ) : (
            notes.arcs.map((arc) => (
              <div
                key={arc.id}
                className="space-y-3 rounded-2xl border border-zinc-800 bg-black/20 p-4"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={arc.title}
                    onChange={(event) =>
                      updateArc(arc.id, { title: event.target.value })
                    }
                    placeholder="Arc title..."
                    className="min-w-0 flex-1 border-b border-zinc-700 bg-transparent pb-1 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                  <select
                    value={arc.status}
                    onChange={(event) =>
                      updateArc(arc.id, {
                        status: event.target.value as BiblePlanningArc["status"],
                      })
                    }
                    className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 focus:border-purple-500 focus:outline-none"
                  >
                    {ARC_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {capitalize(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Intent
                    </label>
                    <textarea
                      value={arc.intent}
                      onChange={(event) =>
                        updateArc(arc.id, { intent: event.target.value })
                      }
                      placeholder="Why does this arc matter?"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Horizon
                    </label>
                    <input
                      type="text"
                      value={arc.horizon ?? ""}
                      onChange={(event) =>
                        updateArc(arc.id, { horizon: event.target.value })
                      }
                      placeholder={`Expected landing window or ${unitLabelCapitalized.toLowerCase()} range...`}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Notes
                  </label>
                  <textarea
                    value={arc.notes ?? ""}
                    onChange={(event) =>
                      updateArc(arc.id, { notes: event.target.value })
                    }
                    placeholder="Anything the system should remember about this arc..."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeArc(arc.id)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-red-900/70 px-3 py-2 text-xs font-medium text-red-200 transition-colors hover:border-red-600 hover:text-white"
                    aria-label="Delete arc"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete arc
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Thread Tracker</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Track promises, open loops, callbacks, and follow-ups that still need payoff.
            </p>
          </div>
          <button
            type="button"
            onClick={addThread}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-cyan-700/50 px-3 py-1.5 text-xs text-cyan-300 transition-colors hover:bg-cyan-900/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Add thread
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {notes.threads.length === 0 ? (
            <EmptyPlanningState
              title="No open threads yet"
              description="Add the questions, promises, callbacks, or dangling threads this project should keep alive."
            />
          ) : (
            notes.threads.map((thread) => (
              <div
                key={thread.id}
                className="space-y-3 rounded-2xl border border-zinc-800 bg-black/20 p-4"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={thread.title}
                    onChange={(event) =>
                      updateThread(thread.id, { title: event.target.value })
                    }
                    placeholder="Thread title..."
                    className="min-w-0 flex-1 border-b border-zinc-700 bg-transparent pb-1 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <select
                    value={thread.status}
                    onChange={(event) =>
                      updateThread(thread.id, {
                        status: event.target.value as BiblePlanningThread["status"],
                      })
                    }
                    className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 focus:border-cyan-500 focus:outline-none"
                  >
                    {THREAD_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {capitalize(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Owner
                    </label>
                    <input
                      type="text"
                      value={thread.owner ?? ""}
                      onChange={(event) =>
                        updateThread(thread.id, { owner: event.target.value })
                      }
                      placeholder="Character, theme, source, or promise..."
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Introduced In
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={thread.introducedIn ?? ""}
                      onChange={(event) =>
                        updateThread(thread.id, {
                          introducedIn: toOptionalPositiveNumber(event.target.value),
                        })
                      }
                      placeholder="1"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Target Payoff
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={thread.targetUnit ?? ""}
                      onChange={(event) =>
                        updateThread(thread.id, {
                          targetUnit: toOptionalPositiveNumber(event.target.value),
                        })
                      }
                      placeholder={unitLabelCapitalized}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Notes
                  </label>
                  <textarea
                    value={thread.notes ?? ""}
                    onChange={(event) =>
                      updateThread(thread.id, { notes: event.target.value })
                    }
                    placeholder="What needs to happen, or what should the system watch for?"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeThread(thread.id)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-red-900/70 px-3 py-2 text-xs font-medium text-red-200 transition-colors hover:border-red-600 hover:text-white"
                    aria-label="Delete thread"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete thread
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyPlanningState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-700 bg-black/10 px-4 py-5 text-center">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
    </div>
  );
}

function createEmptyArc(): BiblePlanningArc {
  return {
    id: createLocalId("arc"),
    title: "",
    intent: "",
    status: "planned",
    horizon: "",
    notes: "",
  };
}

function createEmptyThread(): BiblePlanningThread {
  return {
    id: createLocalId("thread"),
    title: "",
    owner: "",
    introducedIn: undefined,
    targetUnit: undefined,
    status: "open",
    notes: "",
  };
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toOptionalPositiveNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
