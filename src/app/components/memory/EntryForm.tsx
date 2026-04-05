"use client";

import { useMemo, useState } from "react";
import type {
  MemoryCustomField,
  MemoryCustomType,
  MemoryEntry,
  CreateMemoryEntryInput,
  UpdateMemoryEntryInput,
} from "../../types/memory";
import type { ProjectMode } from "../../types/story";
import { getModeConfig } from "../../lib/modes/registry";
import CustomFieldEditor from "./CustomFieldEditor";

interface EntryFormProps {
  entry?: MemoryEntry | null;
  customTypes: MemoryCustomType[];
  projectMode?: ProjectMode;
  saving?: boolean;
  submitLabel: string;
  onSubmit: (input: CreateMemoryEntryInput | UpdateMemoryEntryInput) => Promise<void>;
  onCancel?: () => void;
  onDelete?: () => Promise<void>;
}

export default function EntryForm({
  entry,
  customTypes,
  projectMode = "fiction",
  saving = false,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: EntryFormProps) {
  const modeConfig = getModeConfig(projectMode);
  const initialState = getInitialFormState(entry);
  const [name, setName] = useState(initialState.name);
  const [entryType, setEntryType] = useState(initialState.entryType || modeConfig.coreTypes[0] || "character");
  const [description, setDescription] = useState(initialState.description);
  const [aliases, setAliases] = useState(initialState.aliases);
  const [tags, setTags] = useState(initialState.tags);
  const [imageUrl, setImageUrl] = useState(initialState.imageUrl);
  const [color, setColor] = useState(initialState.color);
  const [sortOrder, setSortOrder] = useState(initialState.sortOrder);
  const [customFields, setCustomFields] = useState<MemoryCustomField[]>(
    initialState.customFields
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const typeSuggestions = useMemo(
    () => [...modeConfig.coreTypes, ...customTypes.map((customType) => customType.name)],
    [customTypes, modeConfig.coreTypes]
  );

  const handleEntryTypeChange = (value: string) => {
    setEntryType(value);

    if (customFields.length > 0) {
      return;
    }

    const matchingType = customTypes.find(
      (customType) => customType.name.toLowerCase() === value.trim().toLowerCase()
    );
    if (!matchingType || matchingType.suggestedFields.length === 0) {
      return;
    }

    setCustomFields(
      matchingType.suggestedFields.map((field) => ({
        key: field.key,
        value: "",
      }))
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setLocalError("Entry name is required.");
      return;
    }

    if (!entryType.trim()) {
      setLocalError("Entry type is required.");
      return;
    }

    const parsedSortOrder = Number.parseInt(sortOrder, 10);
    if (Number.isNaN(parsedSortOrder)) {
      setLocalError("Sort order must be a whole number.");
      return;
    }

    setLocalError(null);

    await onSubmit({
      name: name.trim(),
      entryType: entryType.trim(),
      description: description.trim(),
      aliases: splitList(aliases),
      tags: splitList(tags),
      imageUrl: imageUrl.trim() || null,
      color: color.trim() || null,
      sortOrder: parsedSortOrder,
      customFields: sanitizeFields(customFields),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Daphne Greengrass"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">Type</span>
          <input
            list="memory-entry-types"
            value={entryType}
            onChange={(event) => handleEntryTypeChange(event.target.value)}
            placeholder={modeConfig.coreTypes[0] || "character"}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
          />
          <datalist id="memory-entry-types">
            {typeSuggestions.map((typeName) => (
              <option key={typeName} value={typeName} />
            ))}
          </datalist>
        </label>
      </div>

      <label className="space-y-1.5">
        <span className="text-xs font-medium text-zinc-400">Description</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder="What matters about this entry in the story?"
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
        />
      </label>

      <div className="grid grid-cols-1 gap-3">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">Aliases</span>
          <input
            value={aliases}
            onChange={(event) => setAliases(event.target.value)}
            placeholder="Daph, Lady Greengrass"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">Tags</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="ally, slytherin, politics"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-zinc-400">Image URL</span>
          <input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">Sort order</span>
          <input
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            inputMode="numeric"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
          />
        </label>
      </div>

      <label className="space-y-1.5">
        <span className="text-xs font-medium text-zinc-400">Accent color</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={normalizeColor(color)}
            onChange={(event) => setColor(event.target.value)}
            className="h-10 w-12 rounded-lg border border-zinc-800 bg-transparent"
          />
          <input
            value={color}
            onChange={(event) => setColor(event.target.value)}
            placeholder="#a855f7"
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
          />
        </div>
      </label>

      <CustomFieldEditor
        fields={customFields}
        onChange={setCustomFields}
        label="Custom fields"
        keyPlaceholder="role"
        valuePlaceholder="Potions prodigy"
      />

      {localError && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {localError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : submitLabel}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Cancel
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => {
              void onDelete();
            }}
            className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-300 transition-colors hover:border-red-400 hover:bg-red-500/10"
          >
            Delete entry
          </button>
        )}
      </div>
    </form>
  );
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeFields(fields: MemoryCustomField[]): MemoryCustomField[] {
  return fields
    .map((field) => ({
      key: field.key.trim(),
      value: field.value.trim(),
    }))
    .filter((field) => field.key.length > 0);
}

function normalizeColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : "#a855f7";
}

function getInitialFormState(entry?: MemoryEntry | null) {
  return {
    name: entry?.name ?? "",
    entryType: entry?.entryType ?? "",
    description: entry?.description ?? "",
    aliases: (entry?.aliases ?? []).join(", "),
    tags: (entry?.tags ?? []).join(", "),
    imageUrl: entry?.imageUrl ?? "",
    color: entry?.color ?? "",
    sortOrder: String(entry?.sortOrder ?? 0),
    customFields: entry?.customFields ?? [],
  };
}
