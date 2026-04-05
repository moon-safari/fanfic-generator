import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface MemoryMentionItem {
  id: string;
  entryId: string;
  startIndex: number;
  endIndex: number;
}

interface MemoryMentionPluginState {
  decorations: DecorationSet;
  mentions: MemoryMentionItem[];
}

interface TextSegment {
  docStart: number;
  textStart: number;
  textEnd: number;
}

export const memoryMentionPluginKey = new PluginKey("codexMentions");

export const MemoryMentionExtension = Extension.create({
  name: "codexMentions",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: memoryMentionPluginKey,
        state: {
          init(): MemoryMentionPluginState {
            return {
              decorations: DecorationSet.empty,
              mentions: [],
            };
          },
          apply(tr, prev, _oldState, newState): MemoryMentionPluginState {
            const meta = tr.getMeta(memoryMentionPluginKey) as
              | { mentions: MemoryMentionItem[] }
              | undefined;

            if (meta?.mentions) {
              return {
                decorations: buildDecorations(newState.doc, meta.mentions),
                mentions: meta.mentions,
              };
            }

            if (tr.docChanged) {
              return {
                decorations: buildDecorations(newState.doc, prev.mentions),
                mentions: prev.mentions,
              };
            }

            return prev;
          },
        },
        props: {
          decorations(state) {
            const pluginState = this.getState(state) as
              | MemoryMentionPluginState
              | undefined;
            return pluginState?.decorations ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

function buildDecorations(
  doc: ProseMirrorNode,
  mentions: MemoryMentionItem[]
): DecorationSet {
  if (mentions.length === 0) {
    return DecorationSet.empty;
  }

  const decorations: Decoration[] = [];
  const segments = buildTextSegments(doc);

  for (const mention of mentions) {
    const from = findDocPosition(segments, mention.startIndex, "start");
    const to = findDocPosition(segments, mention.endIndex, "end");

    if (from === null || to === null || from >= to) {
      continue;
    }

    decorations.push(
      Decoration.inline(from, to, {
        class:
          "rounded bg-sky-400/10 ring-1 ring-inset ring-sky-300/20 cursor-pointer transition-colors hover:bg-sky-400/18",
        "data-memory-entry-id": mention.entryId,
        "data-memory-mention-id": mention.id,
      })
    );
  }

  return DecorationSet.create(doc, decorations);
}

function buildTextSegments(doc: ProseMirrorNode): TextSegment[] {
  const segments: TextSegment[] = [];
  let plainTextIndex = 0;
  let previousTextEndPos = 0;

  doc.descendants((node: ProseMirrorNode, pos: number) => {
    if (!node.isText || !node.text) {
      return;
    }

    const separator = doc.textBetween(previousTextEndPos, pos, "\n\n", "\0");
    plainTextIndex += separator.length;

    const textStart = plainTextIndex;
    const textEnd = textStart + node.text.length;

    segments.push({
      docStart: pos,
      textStart,
      textEnd,
    });

    plainTextIndex = textEnd;
    previousTextEndPos = pos + node.nodeSize;
  });

  return segments;
}

function findDocPosition(
  segments: TextSegment[],
  textIndex: number,
  mode: "start" | "end"
): number | null {
  for (const segment of segments) {
    const containsIndex =
      mode === "start"
        ? textIndex >= segment.textStart && textIndex < segment.textEnd
        : textIndex > segment.textStart && textIndex <= segment.textEnd;

    if (containsIndex) {
      return segment.docStart + (textIndex - segment.textStart);
    }

    if (mode === "end" && textIndex === segment.textStart) {
      return segment.docStart;
    }
  }

  return null;
}
