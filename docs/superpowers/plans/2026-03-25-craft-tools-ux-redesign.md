# Craft Tools UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign craft tools with unified tabbed side panel, sensory Describe, expanded Brainstorm, persistent history, undo toast, and mobile bottom sheet.

**Architecture:** Replace the floating CraftToolbar/CraftDrawer/CraftPreview with a unified SidePanel (Bible/Craft/History tabs). Craft tool buttons move into EditorToolbar header. New `useCraftPanel` hook manages all panel state. History saved server-side in new `craft_history` Supabase table. Mobile uses a bottom sheet for results.

**Tech Stack:** Next.js 14+ App Router, React, TypeScript, Tailwind CSS, Tiptap 2, Supabase Postgres, Anthropic Claude API (Haiku + Sonnet), Lucide React icons

**Spec:** `docs/superpowers/specs/2026-03-24-craft-tools-ux-redesign-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|----------------|
| `src/app/components/editor/SidePanel.tsx` | Tabbed container (Bible/Craft/History) with close button, tab bar |
| `src/app/components/editor/CraftTab.tsx` | Craft tool results: direction input, result cards, error/empty states |
| `src/app/components/editor/DescribeResults.tsx` | Sensory cards (Blend + 5 senses) with Insert/Copy per card |
| `src/app/components/editor/BrainstormResults.tsx` | Expanded idea cards with title/description/prose + Use this/Copy |
| `src/app/components/editor/HistoryTab.tsx` | Per-chapter craft history list with Re-insert/Copy |
| `src/app/components/editor/UndoToast.tsx` | 5-second countdown toast with Undo button |
| `src/app/components/editor/MobileBottomSheet.tsx` | Generic bottom sheet with drag-to-dismiss |
| `src/app/components/editor/MobileCraftSheet.tsx` | Craft-specific bottom sheet content |
| `src/app/hooks/useCraftPanel.ts` | Unified panel state hook replacing `useCraftTools` |
| `src/app/api/craft/history/route.ts` | GET endpoint for chapter history |
| `src/app/api/craft/history/[id]/route.ts` | PATCH endpoint to update history status |
| `src/app/lib/supabase/craftHistory.ts` | DB helpers for craft_history table |
| `src/app/types/craft.ts` | Shared craft tool types (CraftResult, CraftTool, etc.) |

### Modified Files
| File | Change |
|------|--------|
| `src/app/components/editor/EditorToolbar.tsx` | Add 4 craft tool buttons + new props |
| `src/app/components/editor/StoryEditor.tsx` | Replace CraftToolbar/Drawer/Preview with SidePanel, use useCraftPanel |
| `src/app/components/story-bible/StoryBiblePanel.tsx` | Extract into headless body (remove outer shell/header) |
| `src/app/api/craft/describe/route.ts` | Return sensory structured response + save history |
| `src/app/api/craft/brainstorm/route.ts` | Rename preview→prose + save history |
| `src/app/api/craft/rewrite/route.ts` | Save history after generation |
| `src/app/api/craft/expand/route.ts` | Save history after generation |
| `src/app/api/craft/shared.ts` | Return user_id and chapter info for history saves |
| `src/app/lib/prompts/craft.ts` | Update describe prompt for sensory JSON, brainstorm for prose field |

### Deleted Files
| File | Reason |
|------|--------|
| `src/app/components/editor/CraftToolbar.tsx` | Replaced by EditorToolbar buttons |
| `src/app/components/editor/CraftDrawer.tsx` | Replaced by MobileBottomSheet |
| `src/app/components/editor/CraftPreview.tsx` | Replaced by CraftTab in SidePanel |
| `src/app/components/editor/useCraftTools.ts` | Replaced by useCraftPanel |

---

## Task 1: Create shared craft types

**Files:**
- Create: `src/app/types/craft.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/app/types/craft.ts
export type CraftTool = "rewrite" | "expand" | "describe" | "brainstorm";

export interface SenseDescription {
  type: "sight" | "smell" | "sound" | "touch" | "taste";
  text: string;
}

export interface BrainstormIdea {
  title: string;
  description: string;
  prose: string;
}

export type CraftResult =
  | { type: "rewrite"; text: string }
  | { type: "expand"; text: string }
  | { type: "describe"; blend: string; senses: SenseDescription[] }
  | { type: "brainstorm"; ideas: BrainstormIdea[] };

export type SidePanelTab = "bible" | "craft" | "history";

export interface CraftHistoryEntry {
  id: string;
  storyId: string;
  chapterNumber: number;
  toolType: CraftTool;
  direction: string | null;
  selectedText: string;
  result: CraftResult;
  status: "generated" | "inserted" | "dismissed";
  createdAt: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `src/app/types/craft.ts`

- [ ] **Step 3: Commit**

```bash
git add src/app/types/craft.ts
git commit -m "feat(craft): add shared craft tool types"
```

---

## Task 2: Update craft API shared helper to return user_id

The shared `authenticateAndFetchBible` helper needs to return `userId` so craft routes can save history entries.

**Files:**
- Modify: `src/app/api/craft/shared.ts`

- [ ] **Step 1: Update CraftContext interface and return value**

In `src/app/api/craft/shared.ts`, add `userId` to the `CraftContext` interface:

```typescript
export interface CraftContext {
  selectedText: string;
  context: string;
  direction: string;
  bibleContext: string;
  userId: string;      // ADD THIS
  storyId: string;     // ADD THIS
}
```

Then in the `authenticateAndFetchBible` function, update the return statement (line 106) from:

```typescript
  return { selectedText, context, direction, bibleContext };
```

to:

```typescript
  return { selectedText, context, direction, bibleContext, userId: user.id, storyId };
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors (existing routes destructure only what they need, so adding fields is safe)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/craft/shared.ts
git commit -m "feat(craft): return userId and storyId from shared auth helper"
```

---

## Task 3: Create craft_history database table and helpers

**Files:**
- Create: `src/app/lib/supabase/craftHistory.ts`

- [ ] **Step 1: Create the Supabase migration SQL**

Save this SQL to run in Supabase dashboard:

```sql
CREATE TABLE craft_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('rewrite', 'expand', 'describe', 'brainstorm')),
  direction TEXT,
  selected_text TEXT NOT NULL,
  result JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'inserted', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_craft_history_story_chapter ON craft_history(story_id, chapter_number);
ALTER TABLE craft_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own craft history"
  ON craft_history FOR ALL USING (auth.uid() = user_id);
```

- [ ] **Step 2: Create the database helper file**

```typescript
// src/app/lib/supabase/craftHistory.ts
import { createServerSupabase } from "./server";
import { CraftTool, CraftResult, CraftHistoryEntry } from "../../types/craft";

export async function saveCraftHistory(params: {
  storyId: string;
  chapterNumber: number;
  toolType: CraftTool;
  direction: string | null;
  selectedText: string;
  result: CraftResult;
  userId: string;
}): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.from("craft_history").insert({
    story_id: params.storyId,
    chapter_number: params.chapterNumber,
    tool_type: params.toolType,
    direction: params.direction,
    selected_text: params.selectedText,
    result: params.result as unknown as Record<string, unknown>,
    user_id: params.userId,
  });
}

export async function getCraftHistory(
  storyId: string,
  userId: string
): Promise<CraftHistoryEntry[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("craft_history")
    .select("*")
    .eq("story_id", storyId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    storyId: row.story_id as string,
    chapterNumber: row.chapter_number as number,
    toolType: row.tool_type as CraftTool,
    direction: row.direction as string | null,
    selectedText: row.selected_text as string,
    result: row.result as CraftResult,
    status: row.status as "generated" | "inserted" | "dismissed",
    createdAt: row.created_at as string,
  }));
}

export async function updateCraftHistoryStatus(
  id: string,
  status: "inserted" | "dismissed",
  userId: string
): Promise<boolean> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("craft_history")
    .update({ status })
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/lib/supabase/craftHistory.ts
git commit -m "feat(craft): add craft_history database helpers"
```

---

## Task 4: Create craft history API routes

**Files:**
- Create: `src/app/api/craft/history/route.ts`
- Create: `src/app/api/craft/history/[id]/route.ts`

- [ ] **Step 1: Create GET history endpoint**

```typescript
// src/app/api/craft/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../../lib/supabase/server";
import { getCraftHistory } from "../../../lib/supabase/craftHistory";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get("storyId");
    if (!storyId) {
      return NextResponse.json({ error: "storyId required" }, { status: 400 });
    }

    const entries = await getCraftHistory(storyId, user.id);
    return NextResponse.json({ entries });
  } catch (err) {
    console.error("History fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create PATCH status endpoint**

```typescript
// src/app/api/craft/history/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase/server";
import { updateCraftHistoryStatus } from "../../../../lib/supabase/craftHistory";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status: "inserted" | "dismissed" };

    if (!status || !["inserted", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const ok = await updateCraftHistoryStatus(id, status, user.id);
    if (!ok) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("History update error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/craft/history/
git commit -m "feat(craft): add history API endpoints (GET + PATCH)"
```

---

## Task 5: Update craft API prompts for sensory Describe and prose Brainstorm

**Files:**
- Modify: `src/app/lib/prompts/craft.ts`

- [ ] **Step 1: Update buildDescribePrompt**

Replace the `buildDescribePrompt` function (lines 32-46) with:

```typescript
export function buildDescribePrompt(
  selectedText: string,
  context: string,
  bibleContext: string
): string {
  return `You are a skilled fiction writer. Generate vivid sensory descriptions for the selected passage.

For each relevant sense (sight, smell, sound, touch, taste), write a 2-3 sentence description. Skip senses that don't naturally apply. Then write a "blend" that combines the best elements from all senses into one cohesive passage.
${bibleContext ? `\n${bibleContext}\n` : ""}
${context ? `SURROUNDING CONTEXT:\n${context}\n` : ""}
SELECTED TEXT:
${selectedText}

Output ONLY valid JSON with this exact structure. No explanations, no markdown fences:

{
  "blend": "A combined passage weaving together the most vivid sensory details...",
  "senses": [
    { "type": "sight", "text": "Visual description..." },
    { "type": "sound", "text": "Auditory description..." }
  ]
}

Only include senses that are relevant. Always include "blend".`;
}
```

- [ ] **Step 2: Update buildBrainstormPrompt**

Replace the `buildBrainstormPrompt` function (lines 48-68) — change `"preview"` to `"prose"` in the JSON template:

```typescript
export function buildBrainstormPrompt(
  selectedText: string,
  context: string,
  bibleContext: string
): string {
  return `You are a creative story planner. Generate 5 compelling plot directions that could follow from the selected passage. Each direction should be distinct, dramatically interesting, and feel earned by the story so far.
${bibleContext ? `\n${bibleContext}\n` : ""}
${context ? `SURROUNDING CONTEXT:\n${context}\n` : ""}
SELECTED TEXT / CURRENT MOMENT:
${selectedText}

Output ONLY a valid JSON array of 5 objects with this exact structure. No explanations, no markdown fences:

[
  {
    "title": "Short evocative title for this direction",
    "description": "2-3 sentence description of what happens in this direction",
    "prose": "1-2 sentence opening paragraph showing how this direction would read in the story"
  }
]`;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/lib/prompts/craft.ts
git commit -m "feat(craft): update prompts for sensory describe and prose brainstorm"
```

---

## Task 6: Update Describe and Brainstorm API routes

Update the API routes to parse the new response shapes and save history.

**Files:**
- Modify: `src/app/api/craft/describe/route.ts`
- Modify: `src/app/api/craft/brainstorm/route.ts`

- [ ] **Step 1: Rewrite describe route**

Replace the entire content of `src/app/api/craft/describe/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateAndFetchBible } from "../shared";
import { buildDescribePrompt } from "../../../lib/prompts/craft";
import { saveCraftHistory } from "../../../lib/supabase/craftHistory";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateAndFetchBible(req);

    if ("error" in authResult) {
      return authResult.error;
    }

    const { selectedText, context, bibleContext, userId, storyId } = authResult;

    const prompt = buildDescribePrompt(selectedText, context, bibleContext);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON object from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { result: { blend: "", senses: [] } },
        { status: 200 }
      );
    }

    let parsed: { blend: string; senses: { type: string; text: string }[] };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { result: { blend: "", senses: [] } },
        { status: 200 }
      );
    }

    const craftResult = {
      type: "describe" as const,
      blend: parsed.blend || "",
      senses: (parsed.senses || []).map((s) => ({
        type: s.type as "sight" | "smell" | "sound" | "touch" | "taste",
        text: s.text,
      })),
    };

    // Save to history (non-blocking)
    saveCraftHistory({
      storyId,
      chapterNumber: 0, // Client should pass this; default to 0
      toolType: "describe",
      direction: null,
      selectedText,
      result: craftResult,
      userId,
    }).catch(() => {});

    return NextResponse.json({ result: craftResult }, { status: 200 });
  } catch (err) {
    console.error("Describe error:", err);
    const message = err instanceof Error ? err.message : "Describe failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Rewrite brainstorm route**

Replace the entire content of `src/app/api/craft/brainstorm/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateAndFetchBible } from "../shared";
import { buildBrainstormPrompt } from "../../../lib/prompts/craft";
import { saveCraftHistory } from "../../../lib/supabase/craftHistory";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateAndFetchBible(req);

    if ("error" in authResult) {
      return authResult.error;
    }

    const { selectedText, context, bibleContext, userId, storyId } = authResult;

    const prompt = buildBrainstormPrompt(selectedText, context, bibleContext);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ result: [] }, { status: 200 });
    }

    let parsed: { title: string; description: string; prose: string }[];
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ result: [] }, { status: 200 });
    }

    const ideas = parsed.map((item) => ({
      title: item.title || "",
      description: item.description || "",
      prose: item.prose || "",
    }));

    const craftResult = { type: "brainstorm" as const, ideas };

    // Save to history (non-blocking)
    saveCraftHistory({
      storyId,
      chapterNumber: 0,
      toolType: "brainstorm",
      direction: null,
      selectedText,
      result: craftResult,
      userId,
    }).catch(() => {});

    return NextResponse.json({ result: ideas }, { status: 200 });
  } catch (err) {
    console.error("Brainstorm error:", err);
    const message = err instanceof Error ? err.message : "Brainstorm failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/craft/describe/route.ts src/app/api/craft/brainstorm/route.ts
git commit -m "feat(craft): update describe/brainstorm APIs for sensory+prose responses and history"
```

---

## Task 7: Add history saving to Rewrite and Expand routes

**Files:**
- Modify: `src/app/api/craft/rewrite/route.ts`
- Modify: `src/app/api/craft/expand/route.ts`

- [ ] **Step 1: Update rewrite route**

In `src/app/api/craft/rewrite/route.ts`, add the history import and save call. The destructure on line 18 becomes:

```typescript
    const { selectedText, context, direction, bibleContext, userId, storyId } = result;
```

After the `text` variable is set (line 30), before the return, add:

```typescript
    // Save to history (non-blocking)
    const { saveCraftHistory } = await import("../../../lib/supabase/craftHistory");
    saveCraftHistory({
      storyId,
      chapterNumber: 0,
      toolType: "rewrite",
      direction: direction || null,
      selectedText,
      result: { type: "rewrite", text: text.trim() },
      userId,
    }).catch(() => {});
```

- [ ] **Step 2: Update expand route**

Apply the same pattern to `src/app/api/craft/expand/route.ts`. Update destructure to include `userId, storyId`, and add:

```typescript
    // Save to history (non-blocking)
    const { saveCraftHistory } = await import("../../../lib/supabase/craftHistory");
    saveCraftHistory({
      storyId,
      chapterNumber: 0,
      toolType: "expand",
      direction: null,
      selectedText,
      result: { type: "expand", text: text.trim() },
      userId,
    }).catch(() => {});
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/craft/rewrite/route.ts src/app/api/craft/expand/route.ts
git commit -m "feat(craft): add history saving to rewrite and expand routes"
```

---

## Task 8: Create useCraftPanel hook

**Files:**
- Create: `src/app/hooks/useCraftPanel.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/app/hooks/useCraftPanel.ts
"use client";

import { useState, useCallback } from "react";
import {
  CraftTool,
  CraftResult,
  SidePanelTab,
} from "../types/craft";

interface CraftPanelState {
  isOpen: boolean;
  activeTab: SidePanelTab;
  activeTool: CraftTool | null;
  selectedText: string | null;
  direction: string;
  result: CraftResult | null;
  error: string | null;
  loading: boolean;
  panelWidth: "normal" | "expanded";
}

const initialState: CraftPanelState = {
  isOpen: false,
  activeTab: "bible",
  activeTool: null,
  selectedText: null,
  direction: "",
  result: null,
  error: null,
  loading: false,
  panelWidth: "normal",
};

export function useCraftPanel(storyId: string) {
  const [state, setState] = useState<CraftPanelState>(initialState);

  const openTab = useCallback((tab: SidePanelTab) => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      activeTab: tab,
      panelWidth: tab === "craft" && prev.activeTool === "brainstorm" ? "expanded" : "normal",
    }));
  }, []);

  const closePanel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      panelWidth: "normal",
    }));
  }, []);

  const setTab = useCallback((tab: SidePanelTab) => {
    setState((prev) => ({
      ...prev,
      activeTab: tab,
      panelWidth: tab === "craft" && prev.activeTool === "brainstorm" && prev.result ? "expanded" : "normal",
    }));
  }, []);

  const callTool = useCallback(
    async (
      tool: CraftTool,
      selectedText: string,
      context: string,
      direction?: string
    ) => {
      setState((prev) => ({
        ...prev,
        isOpen: true,
        activeTab: "craft",
        activeTool: tool,
        selectedText,
        direction: direction || "",
        result: null,
        error: null,
        loading: true,
        panelWidth: "normal",
      }));

      try {
        const res = await fetch(`/api/craft/${tool}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyId,
            selectedText,
            context,
            direction: direction || "",
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `${tool} failed`);
        }

        const data = await res.json();
        let result: CraftResult;

        if (tool === "rewrite") {
          result = { type: "rewrite", text: data.result as string };
        } else if (tool === "expand") {
          result = { type: "expand", text: data.result as string };
        } else if (tool === "describe") {
          const d = data.result as { blend: string; senses: { type: string; text: string }[] };
          result = {
            type: "describe",
            blend: d.blend || "",
            senses: (d.senses || []).map((s: { type: string; text: string }) => ({
              type: s.type as "sight" | "smell" | "sound" | "touch" | "taste",
              text: s.text,
            })),
          };
        } else {
          // brainstorm
          const ideas = (data.result as { title: string; description: string; prose: string }[]).map(
            (item: { title: string; description: string; prose: string }) => ({
              title: item.title || "",
              description: item.description || "",
              prose: item.prose || "",
            })
          );
          result = { type: "brainstorm", ideas };
        }

        setState((prev) => ({
          ...prev,
          result,
          loading: false,
          panelWidth: tool === "brainstorm" ? "expanded" : "normal",
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "Something went wrong",
          loading: false,
        }));
      }
    },
    [storyId]
  );

  const setDirection = useCallback((direction: string) => {
    setState((prev) => ({ ...prev, direction }));
  }, []);

  const dismiss = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeTool: null,
      result: null,
      error: null,
      loading: false,
      panelWidth: "normal",
    }));
  }, []);

  return {
    ...state,
    openTab,
    closePanel,
    setTab,
    callTool,
    setDirection,
    dismiss,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/hooks/useCraftPanel.ts
git commit -m "feat(craft): add useCraftPanel unified state hook"
```

---

## Task 9: Extract StoryBiblePanel into headless body

**Files:**
- Modify: `src/app/components/story-bible/StoryBiblePanel.tsx`

- [ ] **Step 1: Create StoryBibleBody export**

The goal is to keep the existing `StoryBiblePanel` working while also exporting a `StoryBibleBody` that omits the outer wrapper and header. At the bottom of the file, add a new export. Also refactor the existing component to reuse the body.

In `StoryBiblePanel.tsx`, rename the existing component to `StoryBibleBody` and create a thin wrapper:

1. Change the interface name and component:
   - Keep existing `StoryBiblePanelProps` and `StoryBiblePanel` as-is for backwards compat
   - Add new `StoryBibleBodyProps` and `StoryBibleBody`

Add after line 300 (before the final closing):

```typescript
// Headless body for embedding in SidePanel tabs
interface StoryBibleBodyProps {
  storyId: string;
}

export function StoryBibleBody({ storyId }: StoryBibleBodyProps) {
  const [bible, setBible] = useState<StoryBible | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<BibleSectionType | null>("characters");
  const [regenerating, setRegenerating] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBible = useCallback(async () => {
    try {
      const res = await fetch(`/api/story-bible/${storyId}`);
      if (res.ok) {
        const data = await res.json();
        setBible(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    fetchBible();
  }, [fetchBible]);

  const saveSection = useCallback(
    (sectionType: BibleSectionType, content: BibleSectionContent) => {
      setBible((prev) => {
        const emptySections = Object.fromEntries(
          SECTION_CONFIG.map((c) => [c.type, null])
        ) as StoryBible["sections"];
        const base: StoryBible = prev ?? { storyId, sections: emptySections };
        return {
          ...base,
          sections: {
            ...base.sections,
            [sectionType]: base.sections[sectionType]
              ? { ...base.sections[sectionType], content }
              : {
                  id: "",
                  storyId,
                  sectionType,
                  content,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
          },
        };
      });

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/story-bible/${storyId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sectionType, content }),
          });
        } catch {
          // silently fail
        }
      }, 1000);
    },
    [storyId]
  );

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await fetch("/api/story-bible/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId }),
      });
      await fetchBible();
    } catch {
      // silently fail
    } finally {
      setRegenerating(false);
    }
  };

  const getSectionContent = (type: BibleSectionType): BibleSectionContent | null => {
    return bible?.sections[type]?.content ?? null;
  };

  const getCharacterCount = (): number | undefined => {
    const content = getSectionContent("characters") as BibleCharactersContent | null;
    return content?.characters?.length;
  };

  const getOutlineCount = (): number | undefined => {
    const content = getSectionContent("outline") as BibleOutlineContent | null;
    return content?.chapters?.length;
  };

  const renderSectionContent = (type: BibleSectionType) => {
    // Same switch as the main component
    switch (type) {
      case "characters":
        return <CharacterCard content={getSectionContent(type) as BibleCharactersContent | null} onSave={(c) => saveSection(type, c)} />;
      case "world":
        return <WorldEditor content={getSectionContent(type) as BibleWorldContent | null} onSave={(c) => saveSection(type, c)} />;
      case "synopsis":
        return <SynopsisEditor content={getSectionContent(type) as BibleSynopsisContent | null} onSave={(c) => saveSection(type, c)} />;
      case "genre":
        return <GenreEditor content={getSectionContent(type) as BibleGenreContent | null} onSave={(c) => saveSection(type, c)} />;
      case "style_guide":
        return <StyleGuideEditor content={getSectionContent(type) as BibleStyleGuideContent | null} onSave={(c) => saveSection(type, c)} />;
      case "outline":
        return <OutlineEditor content={getSectionContent(type) as BibleOutlineContent | null} onSave={(c) => saveSection(type, c)} />;
      case "notes":
        return <NotesEditor content={getSectionContent(type) as BibleNotesContent | null} onSave={(c) => saveSection(type, c)} />;
    }
  };

  const getCount = (type: BibleSectionType): number | undefined => {
    if (type === "characters") return getCharacterCount();
    if (type === "outline") return getOutlineCount();
    return undefined;
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-purple-900/20 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {SECTION_CONFIG.map((cfg) => (
          <BibleSection
            key={cfg.type}
            icon={cfg.icon}
            title={cfg.title}
            count={getCount(cfg.type)}
            isOpen={openSection === cfg.type}
            onToggle={() => setOpenSection((prev) => (prev === cfg.type ? null : cfg.type))}
          >
            {renderSectionContent(cfg.type)}
          </BibleSection>
        ))}
      </div>
      <div className="p-4 border-t border-purple-900/30 shrink-0">
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-purple-300 border border-purple-700/50 hover:bg-purple-900/30 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
          {regenerating ? "Re-checking..." : "Re-check continuity"}
        </button>
      </div>
    </div>
  );
}
```

Note: This duplicates logic from the main component. An alternative is to refactor the main component to use `StoryBibleBody` internally, but that can be done as cleanup. The key deliverable is a working headless body export.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/components/story-bible/StoryBiblePanel.tsx
git commit -m "feat(bible): add StoryBibleBody headless export for SidePanel embedding"
```

---

## Task 10: Create UndoToast component

**Files:**
- Create: `src/app/components/editor/UndoToast.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/components/editor/UndoToast.tsx
"use client";

import { useState, useEffect, useCallback } from "react";

interface UndoToastProps {
  toolLabel: string;
  duration?: number;
  onUndo: () => void;
  onExpire: () => void;
}

export default function UndoToast({
  toolLabel,
  duration = 5,
  onUndo,
  onExpire,
}: UndoToastProps) {
  const [countdown, setCountdown] = useState(duration);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setFading(true);
      const fadeTimer = setTimeout(onExpire, 300);
      return () => clearTimeout(fadeTimer);
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onExpire]);

  const handleUndo = useCallback(() => {
    onUndo();
  }, [onUndo]);

  return (
    <div
      className={`absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg border border-purple-500/30 bg-[#1a1025] shadow-lg shadow-black/40 transition-opacity duration-300 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <span className="text-sm text-purple-300 whitespace-nowrap">
        ✓ Inserted {toolLabel}
      </span>
      <button
        onClick={handleUndo}
        className="px-3 py-1 rounded text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors min-h-[32px]"
      >
        Undo
      </button>
      <span className="text-xs text-zinc-500">{countdown}s</span>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/components/editor/UndoToast.tsx
git commit -m "feat(craft): add UndoToast component with countdown"
```

---

## Task 11: Create DescribeResults component

**Files:**
- Create: `src/app/components/editor/DescribeResults.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/components/editor/DescribeResults.tsx
"use client";

import { Copy } from "lucide-react";
import { SenseDescription } from "../../types/craft";

const SENSE_CONFIG: Record<string, { emoji: string; color: string }> = {
  sight: { emoji: "👁", color: "bg-blue-500/10 text-blue-400" },
  smell: { emoji: "👃", color: "bg-emerald-500/10 text-emerald-400" },
  sound: { emoji: "👂", color: "bg-amber-500/10 text-amber-400" },
  touch: { emoji: "🤚", color: "bg-rose-500/10 text-rose-400" },
  taste: { emoji: "👅", color: "bg-orange-500/10 text-orange-400" },
};

interface DescribeResultsProps {
  blend: string;
  senses: SenseDescription[];
  onInsert: (text: string) => void;
}

export default function DescribeResults({
  blend,
  senses,
  onInsert,
}: DescribeResultsProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-2">
      {/* Blend card (featured) */}
      {blend && (
        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-950/40 to-zinc-900/60 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">
              ✨
            </span>
            <span className="text-[10px] font-bold tracking-wider text-purple-400 uppercase">
              Blend
            </span>
            <span className="text-[9px] text-zinc-500 ml-auto">Recommended</span>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{blend}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onInsert(blend)}
              className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors min-h-[32px]"
            >
              ↵ Insert
            </button>
            <button
              onClick={() => handleCopy(blend)}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors min-h-[32px]"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Individual sense cards */}
      {senses.map((sense) => {
        const config = SENSE_CONFIG[sense.type];
        if (!config) return null;
        return (
          <div
            key={sense.type}
            className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-700/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${config.color}`}
              >
                {config.emoji}
              </span>
              <span className="text-[10px] font-bold tracking-wider text-purple-400 uppercase">
                {sense.type}
              </span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{sense.text}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onInsert(sense.text)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors min-h-[32px]"
              >
                ↵ Insert
              </button>
              <button
                onClick={() => handleCopy(sense.text)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors min-h-[32px]"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/components/editor/DescribeResults.tsx
git commit -m "feat(craft): add DescribeResults sensory cards component"
```

---

## Task 12: Create BrainstormResults component

**Files:**
- Create: `src/app/components/editor/BrainstormResults.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/components/editor/BrainstormResults.tsx
"use client";

import { Copy } from "lucide-react";
import { BrainstormIdea } from "../../types/craft";

interface BrainstormResultsProps {
  ideas: BrainstormIdea[];
  onInsert: (text: string) => void;
  onGenerateMore: () => void;
}

export default function BrainstormResults({
  ideas,
  onInsert,
  onGenerateMore,
}: BrainstormResultsProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-xs font-bold tracking-wider text-purple-400 uppercase">
          💡 Brainstorm
        </span>
        <button
          onClick={onGenerateMore}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          + Generate more
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {ideas.map((idea, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-700/50"
          >
            <h4 className="text-sm font-semibold text-zinc-100 mb-1">
              {idea.title}
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed mb-2">
              {idea.description}
            </p>
            {idea.prose && (
              <div className="border-l-2 border-zinc-700 pl-3 mb-3">
                <p className="text-xs text-zinc-500 italic leading-relaxed">
                  &ldquo;{idea.prose}&rdquo;
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => onInsert(idea.prose || idea.description)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors min-h-[32px]"
              >
                ↵ Use this
              </button>
              <button
                onClick={() => handleCopy(idea.prose || idea.description)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors min-h-[32px]"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/components/editor/BrainstormResults.tsx
git commit -m "feat(craft): add BrainstormResults expanded idea cards component"
```

---

## Task 13: Create CraftTab component

**Files:**
- Create: `src/app/components/editor/CraftTab.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/components/editor/CraftTab.tsx
"use client";

import { useState } from "react";
import { Copy, AlertCircle, RefreshCw } from "lucide-react";
import { CraftTool, CraftResult } from "../../types/craft";
import DescribeResults from "./DescribeResults";
import BrainstormResults from "./BrainstormResults";

interface CraftTabProps {
  activeTool: CraftTool | null;
  result: CraftResult | null;
  loading: boolean;
  error: string | null;
  direction: string;
  onDirectionChange: (direction: string) => void;
  onRerun: (direction: string) => void;
  onInsert: (text: string) => void;
  onGenerateMore: () => void;
  onRetry: () => void;
}

function LoadingSkeleton({ tool }: { tool: CraftTool }) {
  if (tool === "describe") {
    return (
      <div className="space-y-2">
        <div className="h-28 bg-purple-900/20 rounded-lg animate-pulse" />
        <div className="h-20 bg-zinc-800/50 rounded-lg animate-pulse" />
        <div className="h-20 bg-zinc-800/50 rounded-lg animate-pulse" />
      </div>
    );
  }
  if (tool === "brainstorm") {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="h-6 w-1/3 bg-zinc-800/50 rounded animate-pulse" />
      <div className="h-32 bg-zinc-800/50 rounded-lg animate-pulse" />
    </div>
  );
}

export default function CraftTab({
  activeTool,
  result,
  loading,
  error,
  direction,
  onDirectionChange,
  onRerun,
  onInsert,
  onGenerateMore,
  onRetry,
}: CraftTabProps) {
  // No tool selected state
  if (!activeTool && !result && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <p className="text-sm text-zinc-500">
          Select text in the editor, then click a craft tool in the toolbar.
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-3">
        <div className="p-4 rounded-lg border border-red-800/40 bg-red-950/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Something went wrong</span>
          </div>
          <p className="text-xs text-zinc-400 mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 transition-colors min-h-[32px]"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && activeTool) {
    return (
      <div className="p-3">
        {(activeTool === "rewrite" || activeTool === "expand") && (
          <DirectionInput
            direction={direction}
            onDirectionChange={onDirectionChange}
            onRerun={onRerun}
            disabled
          />
        )}
        <LoadingSkeleton tool={activeTool} />
      </div>
    );
  }

  // Results
  return (
    <div className="p-3 flex flex-col h-full overflow-y-auto">
      {/* Rewrite / Expand results */}
      {result && (result.type === "rewrite" || result.type === "expand") && (
        <>
          <DirectionInput
            direction={direction}
            onDirectionChange={onDirectionChange}
            onRerun={onRerun}
          />
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
            {result.type === "rewrite" ? "✏️" : "📐"}{" "}
            {result.type}{direction ? ` · "${direction}"` : ""}
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-700/50">
            <p className="text-sm text-zinc-200 leading-relaxed">{result.text}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onInsert(result.text)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors min-h-[32px]"
              >
                ↵ Insert
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(result.text)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors min-h-[32px]"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 text-center mt-3">
            Try another direction ↑ or select new text
          </p>
        </>
      )}

      {/* Describe results */}
      {result && result.type === "describe" && (
        <DescribeResults
          blend={result.blend}
          senses={result.senses}
          onInsert={onInsert}
        />
      )}

      {/* Brainstorm results */}
      {result && result.type === "brainstorm" && (
        <BrainstormResults
          ideas={result.ideas}
          onInsert={onInsert}
          onGenerateMore={onGenerateMore}
        />
      )}
    </div>
  );
}

// Direction input sub-component
function DirectionInput({
  direction,
  onDirectionChange,
  onRerun,
  disabled,
}: {
  direction: string;
  onDirectionChange: (d: string) => void;
  onRerun: (d: string) => void;
  disabled?: boolean;
}) {
  const [localDir, setLocalDir] = useState(direction);

  return (
    <div className="flex gap-2 mb-3">
      <input
        type="text"
        value={localDir}
        onChange={(e) => {
          setLocalDir(e.target.value);
          onDirectionChange(e.target.value);
        }}
        placeholder="Direction (e.g., show not tell)"
        className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !disabled) onRerun(localDir);
        }}
      />
      <button
        onClick={() => onRerun(localDir)}
        disabled={disabled}
        className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-colors min-h-[36px]"
      >
        Go
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/components/editor/CraftTab.tsx
git commit -m "feat(craft): add CraftTab component with results, loading, and error states"
```

---

## Task 14: Create HistoryTab component

**Files:**
- Create: `src/app/components/editor/HistoryTab.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/components/editor/HistoryTab.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, ChevronDown } from "lucide-react";
import { CraftHistoryEntry, CraftTool } from "../../types/craft";

const TOOL_ICONS: Record<CraftTool, string> = {
  rewrite: "✏️",
  expand: "📐",
  describe: "🎨",
  brainstorm: "💡",
};

interface HistoryTabProps {
  storyId: string;
  currentChapter: number;
  onReinsert: (text: string) => void;
}

function getResultPreview(entry: CraftHistoryEntry): string {
  const r = entry.result;
  if (r.type === "rewrite" || r.type === "expand") return r.text;
  if (r.type === "describe") return r.blend || r.senses[0]?.text || "";
  if (r.type === "brainstorm") return entry.result.type === "brainstorm" ? entry.result.ideas[0]?.prose || entry.result.ideas[0]?.title || "" : "";
  return "";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function HistoryTab({
  storyId,
  currentChapter,
  onReinsert,
}: HistoryTabProps) {
  const [entries, setEntries] = useState<CraftHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOlderChapters, setExpandedOlderChapters] = useState<Set<number>>(new Set());

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/craft/history?storyId=${storyId}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-zinc-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <p className="text-sm text-zinc-500">No craft history yet.</p>
        <p className="text-xs text-zinc-600 mt-1">
          Use a craft tool and your results will appear here.
        </p>
      </div>
    );
  }

  // Group by chapter
  const grouped = new Map<number, CraftHistoryEntry[]>();
  for (const entry of entries) {
    const ch = entry.chapterNumber;
    if (!grouped.has(ch)) grouped.set(ch, []);
    grouped.get(ch)!.push(entry);
  }

  const chapters = [...grouped.keys()].sort((a, b) => b - a);

  return (
    <div className="p-3 overflow-y-auto">
      {chapters.map((ch) => {
        const chapterEntries = grouped.get(ch)!;
        const isCurrent = ch === currentChapter;
        const isExpanded = isCurrent || expandedOlderChapters.has(ch);

        return (
          <div key={ch} className="mb-4">
            {!isCurrent && (
              <button
                onClick={() =>
                  setExpandedOlderChapters((prev) => {
                    const next = new Set(prev);
                    if (next.has(ch)) next.delete(ch);
                    else next.add(ch);
                    return next;
                  })
                }
                className="flex items-center gap-1 text-[10px] text-zinc-600 uppercase tracking-wider mb-2 hover:text-zinc-400 transition-colors"
              >
                Chapter {ch} — {chapterEntries.length} entries
                <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>
            )}
            {isCurrent && (
              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">
                Chapter {ch} · Current
              </div>
            )}

            {isExpanded &&
              chapterEntries.map((entry) => {
                const preview = getResultPreview(entry);
                return (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-700/30 mb-1.5"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-purple-400">
                        {TOOL_ICONS[entry.toolType]} {entry.toolType.toUpperCase()}
                      </span>
                      <span className="text-[9px] text-zinc-600">
                        {timeAgo(entry.createdAt)} ·{" "}
                        <span
                          className={
                            entry.status === "inserted"
                              ? "text-emerald-500"
                              : entry.status === "dismissed"
                              ? "text-zinc-500"
                              : "text-zinc-400"
                          }
                        >
                          {entry.status === "generated" ? "Generated" : entry.status === "inserted" ? "Inserted" : "Dismissed"}
                        </span>
                      </span>
                    </div>
                    {entry.direction && (
                      <div className="text-[9px] text-zinc-600 mb-1">
                        Direction: &ldquo;{entry.direction}&rdquo;
                      </div>
                    )}
                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                      {preview}
                    </p>
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => onReinsert(preview)}
                        className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Re-insert
                      </button>
                      <button
                        onClick={() => handleCopy(preview)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-400 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/components/editor/HistoryTab.tsx
git commit -m "feat(craft): add HistoryTab component with per-chapter grouping"
```

---

## Task 15: Create SidePanel tabbed container

**Files:**
- Create: `src/app/components/editor/SidePanel.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/components/editor/SidePanel.tsx
"use client";

import { X, ArrowLeft } from "lucide-react";
import { SidePanelTab, CraftTool, CraftResult } from "../../types/craft";
import { StoryBibleBody } from "../story-bible/StoryBiblePanel";
import CraftTab from "./CraftTab";
import HistoryTab from "./HistoryTab";

interface SidePanelProps {
  storyId: string;
  activeTab: SidePanelTab;
  activeTool: CraftTool | null;
  craftResult: CraftResult | null;
  craftLoading: boolean;
  craftError: string | null;
  craftDirection: string;
  currentChapter: number;
  panelWidth: "normal" | "expanded";
  isMobile: boolean;
  onTabChange: (tab: SidePanelTab) => void;
  onClose: () => void;
  onCraftDirectionChange: (direction: string) => void;
  onCraftRerun: (direction: string) => void;
  onCraftInsert: (text: string) => void;
  onCraftGenerateMore: () => void;
  onCraftRetry: () => void;
  onHistoryReinsert: (text: string) => void;
}

const TABS: { key: SidePanelTab; label: string; icon: string }[] = [
  { key: "bible", label: "Bible", icon: "📖" },
  { key: "craft", label: "Craft", icon: "✨" },
  { key: "history", label: "History", icon: "📜" },
];

export default function SidePanel({
  storyId,
  activeTab,
  activeTool,
  craftResult,
  craftLoading,
  craftError,
  craftDirection,
  currentChapter,
  panelWidth,
  isMobile,
  onTabChange,
  onClose,
  onCraftDirectionChange,
  onCraftRerun,
  onCraftInsert,
  onCraftGenerateMore,
  onCraftRetry,
  onHistoryReinsert,
}: SidePanelProps) {
  const widthClass =
    panelWidth === "expanded"
      ? "w-full sm:w-[50%] sm:min-w-[400px]"
      : "w-full sm:w-[35%] sm:min-w-[320px]";

  return (
    <div
      className={`${widthClass} bg-[#13101e] border-l border-zinc-800 flex flex-col fixed inset-0 sm:static z-50 transition-all duration-300 ease-out`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-12 border-b border-zinc-800 shrink-0">
        <button
          onClick={onClose}
          className="sm:hidden p-2 text-zinc-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="hidden sm:flex p-2 text-zinc-400 hover:text-white transition-colors items-center justify-center"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 py-2.5 text-center text-xs transition-colors ${
              activeTab === tab.key
                ? "text-purple-400 border-b-2 border-purple-500"
                : "text-zinc-500 hover:text-zinc-300 border-b-2 border-transparent"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "bible" && <StoryBibleBody storyId={storyId} />}
        {activeTab === "craft" && (
          <CraftTab
            activeTool={activeTool}
            result={craftResult}
            loading={craftLoading}
            error={craftError}
            direction={craftDirection}
            onDirectionChange={onCraftDirectionChange}
            onRerun={onCraftRerun}
            onInsert={onCraftInsert}
            onGenerateMore={onCraftGenerateMore}
            onRetry={onCraftRetry}
          />
        )}
        {activeTab === "history" && (
          <HistoryTab
            storyId={storyId}
            currentChapter={currentChapter}
            onReinsert={onHistoryReinsert}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/components/editor/SidePanel.tsx
git commit -m "feat(craft): add SidePanel tabbed container (Bible/Craft/History)"
```

---

## Task 16: Add craft tool buttons to EditorToolbar

**Files:**
- Modify: `src/app/components/editor/EditorToolbar.tsx`

- [ ] **Step 1: Update props and add craft buttons**

Add new imports at top:
```typescript
import { CraftTool } from "../../types/craft";
```

Update `EditorToolbarProps` interface to add:
```typescript
  activeCraftTool: CraftTool | null;
  hasSelection: boolean;
  craftLoading: boolean;
  onCraftTool: (tool: CraftTool) => void;
```

In the JSX, before the Bible button (the `<div className="relative">` block around line 99), add the craft tool buttons:

```tsx
            {/* Craft tool buttons */}
            <div className="hidden sm:flex items-center gap-0.5">
              {(
                [
                  { tool: "rewrite" as CraftTool, icon: "✏️", label: "Rewrite" },
                  { tool: "expand" as CraftTool, icon: "📐", label: "Expand" },
                  { tool: "describe" as CraftTool, icon: "🎨", label: "Describe" },
                  { tool: "brainstorm" as CraftTool, icon: "💡", label: "Brainstorm" },
                ] as const
              ).map(({ tool, icon, label }) => (
                <button
                  key={tool}
                  onClick={() => onCraftTool(tool)}
                  className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                    activeCraftTool === tool
                      ? "bg-purple-600/20 text-purple-400 border border-purple-500/40"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                  title={label}
                >
                  {craftLoading && activeCraftTool === tool ? (
                    <span className="animate-spin inline-block">⏳</span>
                  ) : (
                    icon
                  )}{" "}
                  <span className="hidden lg:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Mobile craft tool icons */}
            <div className="flex sm:hidden items-center gap-0.5">
              {(
                [
                  { tool: "rewrite" as CraftTool, icon: "✏️" },
                  { tool: "expand" as CraftTool, icon: "📐" },
                  { tool: "describe" as CraftTool, icon: "🎨" },
                  { tool: "brainstorm" as CraftTool, icon: "💡" },
                ] as const
              ).map(({ tool, icon }) => (
                <button
                  key={tool}
                  onClick={() => onCraftTool(tool)}
                  className={`p-2 rounded-lg text-sm min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                    activeCraftTool === tool
                      ? "bg-purple-600/20 text-purple-400"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {craftLoading && activeCraftTool === tool ? "⏳" : icon}
                </button>
              ))}
            </div>

            <span className="hidden sm:block w-px h-5 bg-zinc-700 mx-1" />
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Errors only about missing prop values in `StoryEditor.tsx` (will fix in next task)

- [ ] **Step 3: Commit**

```bash
git add src/app/components/editor/EditorToolbar.tsx
git commit -m "feat(craft): add craft tool buttons to EditorToolbar header"
```

---

## Task 17: Create MobileBottomSheet and MobileCraftSheet

**Files:**
- Create: `src/app/components/editor/MobileBottomSheet.tsx`
- Create: `src/app/components/editor/MobileCraftSheet.tsx`

- [ ] **Step 1: Create generic bottom sheet**

```typescript
// src/app/components/editor/MobileBottomSheet.tsx
"use client";

import { useRef, useCallback, useEffect } from "react";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileBottomSheet({
  isOpen,
  onClose,
  children,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    currentTranslateY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null || !sheetRef.current) return;
    const deltaY = e.touches[0].clientY - dragStartY.current;
    if (deltaY > 0) {
      currentTranslateY.current = deltaY;
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!sheetRef.current) return;
    if (currentTranslateY.current > 100) {
      onClose();
    } else {
      sheetRef.current.style.transform = "translateY(0)";
    }
    dragStartY.current = null;
    currentTranslateY.current = 0;
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleBackdropClick}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-[#13101e] rounded-t-2xl border-t border-zinc-700 max-h-[60vh] overflow-y-auto transition-transform duration-300 ease-out"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 rounded-full bg-zinc-600" />
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create craft-specific sheet content**

```typescript
// src/app/components/editor/MobileCraftSheet.tsx
"use client";

import { CraftTool, CraftResult } from "../../types/craft";
import CraftTab from "./CraftTab";
import MobileBottomSheet from "./MobileBottomSheet";

interface MobileCraftSheetProps {
  isOpen: boolean;
  activeTool: CraftTool | null;
  result: CraftResult | null;
  loading: boolean;
  error: string | null;
  direction: string;
  onClose: () => void;
  onDirectionChange: (direction: string) => void;
  onRerun: (direction: string) => void;
  onInsert: (text: string) => void;
  onGenerateMore: () => void;
  onRetry: () => void;
}

export default function MobileCraftSheet({
  isOpen,
  activeTool,
  result,
  loading,
  error,
  direction,
  onClose,
  onDirectionChange,
  onRerun,
  onInsert,
  onGenerateMore,
  onRetry,
}: MobileCraftSheetProps) {
  return (
    <MobileBottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-2 pb-4">
        <CraftTab
          activeTool={activeTool}
          result={result}
          loading={loading}
          error={error}
          direction={direction}
          onDirectionChange={onDirectionChange}
          onRerun={onRerun}
          onInsert={onInsert}
          onGenerateMore={onGenerateMore}
          onRetry={onRetry}
        />
      </div>
    </MobileBottomSheet>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/app/components/editor/MobileBottomSheet.tsx src/app/components/editor/MobileCraftSheet.tsx
git commit -m "feat(craft): add MobileBottomSheet and MobileCraftSheet components"
```

---

## Task 18: Rewire StoryEditor to use new components

This is the integration task — rewire `StoryEditor.tsx` to use `useCraftPanel`, `SidePanel`, `EditorToolbar` with craft buttons, `UndoToast`, and `MobileCraftSheet`. Remove old imports.

**Files:**
- Modify: `src/app/components/editor/StoryEditor.tsx`

- [ ] **Step 1: Update imports**

Replace the craft-related imports (lines 13, 17-19) with:

```typescript
import { useCraftPanel } from "../../hooks/useCraftPanel";
import { CraftTool } from "../../types/craft";
import SidePanel from "./SidePanel";
import MobileCraftSheet from "./MobileCraftSheet";
import UndoToast from "./UndoToast";
```

Remove these imports:
```typescript
// DELETE these lines:
import { useCraftTools, CraftTool } from "./useCraftTools";
import CraftToolbar from "./CraftToolbar";
import CraftDrawer from "./CraftDrawer";
import CraftPreview from "./CraftPreview";
```

- [ ] **Step 2: Replace craft state with useCraftPanel**

Replace lines 71-77 (the old craft tools state):

```typescript
  // Old code to remove:
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [selectedText, setSelectedText] = useState("");
  const [selectionContext, setSelectionContext] = useState("");
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const [showCraftUI, setShowCraftUI] = useState(false);
  const craftTools = useCraftTools(story.id);
```

Replace with:

```typescript
  const isMobile = useMediaQuery("(max-width: 767px)");
  const craftPanel = useCraftPanel(story.id);
  const [selectedText, setSelectedText] = useState("");
  const [selectionContext, setSelectionContext] = useState("");

  // Undo toast state
  const [undoToast, setUndoToast] = useState<{ visible: boolean; toolLabel: string }>({
    visible: false,
    toolLabel: "",
  });
```

- [ ] **Step 3: Simplify selection handler**

In the `onSelectionUpdate` callback (line 115), simplify — remove toolbarPosition and showCraftUI logic:

```typescript
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      if (from === to) {
        setSelectedText("");
        return;
      }
      const text = ed.state.doc.textBetween(from, to, " ");
      if (text.trim().length < 3) {
        setSelectedText("");
        return;
      }
      setSelectedText(text);
      // Get surrounding context
      const docText = ed.state.doc.textContent;
      const textBefore = docText.slice(Math.max(0, from - 250), from);
      const textAfter = docText.slice(to, Math.min(docText.length, to + 250));
      setSelectionContext(textBefore + text + textAfter);
    },
```

- [ ] **Step 4: Replace craft handler functions**

Replace `handleCraftTool`, `handleCraftDismiss`, `handleCraftAccept` (lines 162-187) with:

```typescript
  // Handle craft tool invocation from toolbar
  const handleCraftTool = useCallback(
    (tool: CraftTool) => {
      if (!selectedText) {
        // No selection — open panel with hint
        craftPanel.openTab("craft");
        return;
      }
      craftPanel.callTool(tool, selectedText, selectionContext);
    },
    [selectedText, selectionContext, craftPanel]
  );

  // Handle inserting craft result into editor
  const handleCraftInsert = useCallback(
    (text: string) => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      if (from !== to) {
        editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, text).run();
      } else {
        // Insert at cursor if no selection
        editor.chain().focus().insertContentAt(from, text).run();
      }
      setUndoToast({ visible: true, toolLabel: craftPanel.activeTool || "craft" });
    },
    [editor, craftPanel.activeTool]
  );

  // Handle undo
  const handleUndo = useCallback(() => {
    if (!editor) return;
    editor.commands.undo();
    setUndoToast({ visible: false, toolLabel: "" });
  }, [editor]);

  // Handle rerun with new direction
  const handleCraftRerun = useCallback(
    (direction: string) => {
      if (!selectedText || !craftPanel.activeTool) return;
      craftPanel.callTool(craftPanel.activeTool, selectedText, selectionContext, direction);
    },
    [selectedText, selectionContext, craftPanel]
  );

  // Handle brainstorm generate more
  const handleGenerateMore = useCallback(() => {
    if (!selectedText) return;
    craftPanel.callTool("brainstorm", selectedText, selectionContext);
  }, [selectedText, selectionContext, craftPanel]);

  // Handle retry on error
  const handleCraftRetry = useCallback(() => {
    if (!selectedText || !craftPanel.activeTool) return;
    craftPanel.callTool(craftPanel.activeTool, selectedText, selectionContext, craftPanel.direction);
  }, [selectedText, selectionContext, craftPanel]);
```

- [ ] **Step 5: Update the JSX render**

Replace the entire return JSX. Key changes:

1. `EditorToolbar` gets new craft props
2. Replace `{showBible && <StoryBiblePanel .../>}` with `{craftPanel.isOpen && <SidePanel .../>}`
3. Remove old `CraftToolbar`, `CraftDrawer`, `CraftPreview` blocks
4. Add `MobileCraftSheet` for mobile
5. Add `UndoToast`
6. Editor area gets opacity when brainstorm is active

```tsx
  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col z-40">
      <EditorToolbar
        story={story}
        currentChapterIdx={currentChapterIdx}
        totalChapters={story.chapters.length}
        showBible={craftPanel.isOpen && craftPanel.activeTab === "bible"}
        annotationCount={activeAnnotations.length}
        activeCraftTool={craftPanel.activeTool}
        hasSelection={selectedText.length > 0}
        craftLoading={craftPanel.loading}
        onBack={handleBack}
        onPrevChapter={() => switchChapter(currentChapterIdx - 1)}
        onNextChapter={() => switchChapter(currentChapterIdx + 1)}
        onToggleBible={() => {
          if (craftPanel.isOpen && craftPanel.activeTab === "bible") {
            craftPanel.closePanel();
          } else {
            craftPanel.openTab("bible");
          }
        }}
        onCraftTool={handleCraftTool}
        onExport={handleExport}
        onDelete={handleDelete}
      />

      {showDeleteConfirm && (
        <div className="px-4 py-3 bg-red-900/30 border-b border-red-700 flex items-center justify-between shrink-0">
          <p className="text-red-200 text-sm">Delete this story permanently?</p>
          <div className="flex gap-2">
            <button onClick={() => onDelete(story.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500 transition-colors">Delete</button>
            <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1 bg-zinc-700 text-white rounded text-sm hover:bg-zinc-600 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div
          className={`flex-1 overflow-y-auto transition-opacity duration-300 ${
            craftPanel.panelWidth === "expanded" ? "opacity-70" : "opacity-100"
          }`}
          onClick={handleEditorClick}
          onMouseOver={handleEditorMouseOver}
          style={{ position: "relative" }}
        >
          <div className="max-w-3xl mx-auto">
            <EditorContent editor={editor} />
          </div>

          {/* Undo toast */}
          {undoToast.visible && (
            <UndoToast
              toolLabel={undoToast.toolLabel}
              onUndo={handleUndo}
              onExpire={() => setUndoToast({ visible: false, toolLabel: "" })}
            />
          )}
        </div>

        {/* Side Panel (desktop) */}
        {craftPanel.isOpen && !isMobile && (
          <SidePanel
            storyId={story.id}
            activeTab={craftPanel.activeTab}
            activeTool={craftPanel.activeTool}
            craftResult={craftPanel.result}
            craftLoading={craftPanel.loading}
            craftError={craftPanel.error}
            craftDirection={craftPanel.direction}
            currentChapter={currentChapterIdx + 1}
            panelWidth={craftPanel.panelWidth}
            isMobile={false}
            onTabChange={craftPanel.setTab}
            onClose={craftPanel.closePanel}
            onCraftDirectionChange={craftPanel.setDirection}
            onCraftRerun={handleCraftRerun}
            onCraftInsert={handleCraftInsert}
            onCraftGenerateMore={handleGenerateMore}
            onCraftRetry={handleCraftRetry}
            onHistoryReinsert={handleCraftInsert}
          />
        )}
      </div>

      {/* Mobile craft sheet */}
      {isMobile && craftPanel.isOpen && craftPanel.activeTab === "craft" && (
        <MobileCraftSheet
          isOpen
          activeTool={craftPanel.activeTool}
          result={craftPanel.result}
          loading={craftPanel.loading}
          error={craftPanel.error}
          direction={craftPanel.direction}
          onClose={craftPanel.closePanel}
          onDirectionChange={craftPanel.setDirection}
          onRerun={handleCraftRerun}
          onInsert={(text) => {
            handleCraftInsert(text);
            craftPanel.closePanel();
          }}
          onGenerateMore={handleGenerateMore}
          onRetry={handleCraftRetry}
        />
      )}

      {/* Annotation Tooltip */}
      {activeAnnotation && (
        <AnnotationTooltip
          annotation={activeAnnotation}
          anchorRect={annotationAnchorRect}
          onDismiss={handleDismissAnnotation}
          onClose={() => {
            setActiveAnnotation(null);
            setAnnotationAnchorRect(null);
          }}
        />
      )}

      <EditorFooter
        wordCount={wordCount}
        isLatestChapter={isLatestChapter}
        loading={loading}
        error={error}
        onContinue={handleContinue}
      />
    </div>
  );
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 7: Verify dev server starts**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npm run dev` and check for errors in terminal output.

- [ ] **Step 8: Commit**

```bash
git add src/app/components/editor/StoryEditor.tsx
git commit -m "feat(craft): rewire StoryEditor to use SidePanel, useCraftPanel, and new components"
```

---

## Task 19: Delete old craft components

**Files:**
- Delete: `src/app/components/editor/CraftToolbar.tsx`
- Delete: `src/app/components/editor/CraftDrawer.tsx`
- Delete: `src/app/components/editor/CraftPreview.tsx`
- Delete: `src/app/components/editor/useCraftTools.ts`

- [ ] **Step 1: Delete the files**

```bash
cd c:/Users/Lenovo/Desktop/fanfic-generator
rm src/app/components/editor/CraftToolbar.tsx
rm src/app/components/editor/CraftDrawer.tsx
rm src/app/components/editor/CraftPreview.tsx
rm src/app/components/editor/useCraftTools.ts
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors. If there are remaining imports of deleted files, fix them.

- [ ] **Step 3: Verify dev server runs**

Run: `cd c:/Users/Lenovo/Desktop/fanfic-generator && npm run build 2>&1 | tail -10`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(craft): remove old CraftToolbar, CraftDrawer, CraftPreview, useCraftTools"
```

---

## Task 20: Manual testing and polish

- [ ] **Step 1: Run the dev server and test all flows**

Open `http://localhost:3000`, navigate to a story, and test:

1. **Toolbar buttons visible** — all 4 craft tool buttons show in header
2. **No selection hint** — click a tool with no text selected → Craft tab shows hint message
3. **Rewrite flow** — select text → click Rewrite → panel opens to Craft tab → loading skeleton → result card with Insert/Copy → Insert replaces text → undo toast appears → Undo works
4. **Expand flow** — same as rewrite
5. **Describe flow** — select text → click Describe → Blend card + sense cards appear → Insert any card
6. **Brainstorm flow** — select text → click Brainstorm → panel expands to 50% → idea cards with Use this/Copy → Generate more
7. **Bible tab** — click Bible icon → panel opens to Bible tab → all sections work
8. **History tab** — switch to History tab → see past craft results → Re-insert works
9. **Tab switching** — switch between Bible/Craft/History smoothly
10. **Mobile** — resize to 375px → craft tools as icons → bottom sheet slides up on tool use → Insert dismisses sheet
11. **Error handling** — disconnect network → use craft tool → error card with Try again

- [ ] **Step 2: Fix any issues found during testing**

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix(craft): polish craft tools UX after manual testing"
```
