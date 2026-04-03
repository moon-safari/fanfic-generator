"use client";

import { Plus, X } from "lucide-react";
import type { CodexCustomField } from "../../types/codex";

interface CustomFieldEditorProps {
  fields: CodexCustomField[];
  onChange: (fields: CodexCustomField[]) => void;
  label?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
}

export default function CustomFieldEditor({
  fields,
  onChange,
  label = "Fields",
  keyPlaceholder = "Field name",
  valuePlaceholder = "Value",
  addLabel = "Add field",
}: CustomFieldEditorProps) {
  const updateField = (index: number, key: "key" | "value", value: string) => {
    onChange(
      fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, [key]: value } : field
      )
    );
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
  };

  const addField = () => {
    onChange([...fields, { key: "", value: "" }]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {label}
        </p>
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 px-3 py-3 text-xs text-zinc-500">
          No fields yet.
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={`${field.key}-${index}`}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"
            >
              <input
                value={field.key}
                onChange={(event) => updateField(index, "key", event.target.value)}
                placeholder={keyPlaceholder}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
              />
              <input
                value={field.value}
                onChange={(event) => updateField(index, "value", event.target.value)}
                placeholder={valuePlaceholder}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => removeField(index)}
                className="rounded-xl border border-zinc-800 px-2 text-zinc-400 transition-colors hover:border-red-500 hover:text-red-300"
                aria-label="Remove field"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
