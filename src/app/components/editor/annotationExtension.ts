import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface AnnotationItem {
  id: string;
  textMatch: string;
  severity: string;
  annotationType: string;
}

export const annotationPluginKey = new PluginKey("annotations");

export function getAnnotationDecorationClass(
  annotationType: string,
  severity: string
): string {
  if (annotationType === "planning_drift") {
    switch (severity) {
      case "error":
        return "underline decoration-wavy decoration-fuchsia-400 bg-fuchsia-500/15 cursor-pointer";
      case "warning":
        return "underline decoration-wavy decoration-violet-400 bg-violet-500/14 cursor-pointer";
      default:
        return "underline decoration-wavy decoration-purple-400 bg-purple-500/10 cursor-pointer";
    }
  }

  if (annotationType === "suggestion") {
    return "underline decoration-dotted decoration-cyan-400 bg-cyan-400/10 cursor-pointer";
  }

  switch (severity) {
    case "error":
      return "underline decoration-wavy decoration-orange-400 bg-orange-400/10 cursor-pointer";
    case "warning":
      return "underline decoration-wavy decoration-yellow-400 bg-yellow-400/10 cursor-pointer";
    default:
      return "underline decoration-wavy decoration-blue-400 bg-blue-400/10 cursor-pointer";
  }
}

interface AnnotationPluginState {
  decorations: DecorationSet;
  annotations: AnnotationItem[];
}

function buildDecorations(
  doc: ProseMirrorNode,
  annotations: AnnotationItem[]
): DecorationSet {
  const decorations: Decoration[] = [];

  if (!annotations.length) return DecorationSet.empty;

  doc.descendants((node: ProseMirrorNode, pos: number) => {
    if (node.isText) {
      const text = node.text || "";
      for (const ann of annotations) {
        if (!ann.textMatch) continue;
        const idx = text.indexOf(ann.textMatch);
        if (idx === -1) continue;
        const from = pos + idx;
        const to = from + ann.textMatch.length;
        decorations.push(
          Decoration.inline(from, to, {
            class: getAnnotationDecorationClass(
              ann.annotationType,
              ann.severity
            ),
            "data-annotation-id": ann.id,
          })
        );
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const AnnotationExtension = Extension.create({
  name: "annotations",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: annotationPluginKey,
        state: {
          init(): AnnotationPluginState {
            return {
              decorations: DecorationSet.empty,
              annotations: [],
            };
          },
          apply(tr, prev, _oldState, newState): AnnotationPluginState {
            const meta = tr.getMeta(annotationPluginKey) as
              | { annotations: AnnotationItem[] }
              | undefined;
            if (meta?.annotations) {
              return {
                decorations: buildDecorations(newState.doc, meta.annotations),
                annotations: meta.annotations,
              };
            }
            if (tr.docChanged) {
              return {
                decorations: buildDecorations(newState.doc, prev.annotations),
                annotations: prev.annotations,
              };
            }
            return prev;
          },
        },
        props: {
          decorations(state) {
            const pluginState = this.getState(state) as
              | AnnotationPluginState
              | undefined;
            return pluginState?.decorations ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});
