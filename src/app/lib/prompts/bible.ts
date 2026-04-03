import {
  StoryBible,
  BibleCharactersContent,
  BibleWorldContent,
  BibleSynopsisContent,
  BibleGenreContent,
  BibleStyleGuideContent,
  BibleOutlineContent,
  BibleNotesContent,
} from "../../types/bible";
import { hasArcContent, hasThreadContent, normalizeNotesContent } from "../planning";
import type { ProjectMode, StoryModeConfig } from "../../types/story";

export function buildBibleGenerationPrompt(
  chapter1: string,
  options: {
    storyTitle: string;
    fandomContext: string;
    projectMode: ProjectMode;
    modeConfig?: StoryModeConfig;
  }
): string {
  if (options.projectMode === "newsletter") {
    const modeConfig = options.modeConfig;
    const topic =
      modeConfig && "topic" in modeConfig ? modeConfig.topic : "the newsletter topic";
    const audience =
      modeConfig && "audience" in modeConfig ? modeConfig.audience : "the intended audience";
    const issueAngle =
      modeConfig && "issueAngle" in modeConfig
        ? modeConfig.issueAngle
        : "the current issue angle";
    const cadence =
      modeConfig && "cadence" in modeConfig ? modeConfig.cadence : "irregular";
    const subtitle =
      modeConfig && "subtitle" in modeConfig && typeof modeConfig.subtitle === "string"
        ? modeConfig.subtitle
        : "";
    const hookApproach =
      modeConfig && "hookApproach" in modeConfig && typeof modeConfig.hookApproach === "string"
        ? modeConfig.hookApproach
        : "";
    const ctaStyle =
      modeConfig && "ctaStyle" in modeConfig && typeof modeConfig.ctaStyle === "string"
        ? modeConfig.ctaStyle
        : "";
    const recurringSections =
      modeConfig
      && "recurringSections" in modeConfig
      && Array.isArray(modeConfig.recurringSections)
        ? modeConfig.recurringSections.filter((item): item is string => typeof item === "string")
        : [];

    return `You are a project memory analyst. Extract reusable project memory from the first issue of a serialized newsletter.

NEWSLETTER CONTEXT:
- Title: ${options.storyTitle}
- Topic: ${topic}
- Audience: ${audience}
- Current issue angle: ${issueAngle}
- Cadence: ${cadence}
${subtitle ? `- Subtitle: ${subtitle}` : ""}
${hookApproach ? `- Hook approach: ${hookApproach}` : ""}
${ctaStyle ? `- CTA style: ${ctaStyle}` : ""}
${recurringSections.length > 0 ? `- Recurring sections: ${recurringSections.join(", ")}` : ""}

Return ONLY a valid JSON object with exactly this structure — no explanations, no markdown fences:

{
  "characters": {
    "characters": [
      {
        "name": "Person, publication, brand, audience segment, or recurring entity",
        "role": "host|subject|source|audience|supporting",
        "personality": "Relevant traits, positioning, or energy",
        "appearance": "Leave empty unless it truly matters",
        "voice": "How this entity sounds or is framed",
        "relationships": [
          { "character": "Other entity name", "type": "Relationship type" }
        ]
      }
    ]
  },
  "world": {
    "setting": "The domain, scene, or operating context this newsletter lives in",
    "rules": ["Recurring constraints, assumptions, or editorial principles"],
    "locations": ["Relevant platforms, spaces, or recurring arenas"],
    "era": "Current timing or cycle if implied",
    "customs": "Audience or niche norms if implied"
  },
  "synopsis": {
    "text": "2-3 sentence summary of the newsletter promise and what Issue 1 covers"
  },
  "genre": {
    "primary": "Primary newsletter category",
    "secondary": ["Secondary category or adjacent lens"],
    "warnings": ["Content warning or sensitivity if relevant"]
  },
  "style_guide": {
    "pov": "Narrative stance or perspective",
    "tense": "Past or present tense",
    "proseStyle": "Description of the writing style",
    "dialogueStyle": "How quotes, references, or direct voice are handled",
    "pacing": "How quickly the issue moves"
  },
  "outline": {
    "chapters": [
      {
        "number": 1,
        "title": "Issue 1",
        "summary": "What this issue covers",
        "intent": "What this issue is trying to do",
        "keyReveal": "The main reveal, turn, or promise this issue lands",
        "openLoops": ["What should carry forward into future issues"],
        "status": "written"
      }
    ]
  },
  "notes": {
    "text": "Audience promise, recurring segments, CTA style, and anything future issues should remember",
    "arcs": [
      {
        "id": "short-stable-id",
        "title": "Recurring series arc or editorial throughline",
        "intent": "Why this arc matters to the newsletter",
        "status": "planned|active|landed",
        "horizon": "Near-term timing or expected landing window",
        "notes": "Any extra guidance"
      }
    ],
    "threads": [
      {
        "id": "short-stable-id",
        "title": "Open promise, question, callback, or follow-up",
        "owner": "Entity, theme, reader promise, or source",
        "introducedIn": 1,
        "targetUnit": 2,
        "status": "open|building|resolved",
        "notes": "How future issues should handle it"
      }
    ]
  }
}

ISSUE 1 TEXT:
${chapter1}`;
  }

  return `You are a story bible analyst. Extract a comprehensive Story Bible from the provided Chapter 1 text.
${options.fandomContext ? `\nFANDOM CONTEXT:\n${options.fandomContext}\n` : ""}
Analyze the chapter carefully and extract ALL details about characters, world, style, and plot.

Output ONLY a valid JSON object with exactly this structure — no explanations, no markdown fences:

{
  "characters": {
    "characters": [
      {
        "name": "Character name",
        "role": "protagonist|antagonist|supporting|minor",
        "personality": "Key personality traits",
        "appearance": "Physical description if mentioned",
        "voice": "How they speak, dialogue style",
        "relationships": [
          { "character": "Other character name", "type": "Relationship type" }
        ]
      }
    ]
  },
  "world": {
    "setting": "Primary setting description",
    "rules": ["Rule or constraint of this world"],
    "locations": ["Named or described location"],
    "era": "Time period or era",
    "customs": "Social customs or norms observed"
  },
  "synopsis": {
    "text": "2-3 sentence synopsis of the story so far and implied direction"
  },
  "genre": {
    "primary": "Primary genre",
    "secondary": ["Secondary genre or subgenre"],
    "warnings": ["Content warning if applicable"]
  },
  "style_guide": {
    "pov": "Point of view (first person, third limited, etc.)",
    "tense": "Past or present tense",
    "proseStyle": "Description of prose style",
    "dialogueStyle": "How dialogue is handled",
    "pacing": "Pacing description"
  },
  "outline": {
    "chapters": [
      {
        "number": 1,
        "title": "Inferred or given chapter title",
        "summary": "What happens in this chapter",
        "intent": "What this chapter is trying to do",
        "keyReveal": "The main reveal, turn, or promise this chapter lands",
        "openLoops": ["What should carry forward into future chapters"],
        "status": "written"
      }
    ]
  },
  "notes": {
    "text": "Any additional notable details, themes, or craft observations",
    "arcs": [
      {
        "id": "short-stable-id",
        "title": "Major emotional, thematic, or plot arc",
        "intent": "Why this arc matters to the story",
        "status": "planned|active|landed",
        "horizon": "Rough timing for the arc",
        "notes": "Any extra planning detail"
      }
    ],
    "threads": [
      {
        "id": "short-stable-id",
        "title": "Open question, promise, or unresolved thread",
        "owner": "Character, faction, object, or theme",
        "introducedIn": 1,
        "targetUnit": 2,
        "status": "open|building|resolved",
        "notes": "How this should carry forward"
      }
    ]
  }
}

CHAPTER 1 TEXT:
${chapter1}`;
}

export function formatBibleForPrompt(bible: StoryBible): string {
  const sections: string[] = ["=== STORY BIBLE ==="];

  const { sections: bibleSections } = bible;

  if (bibleSections.characters?.content) {
    const chars = bibleSections.characters.content as BibleCharactersContent;
    if (chars.characters && chars.characters.length > 0) {
      sections.push("\n## Characters");
      for (const char of chars.characters) {
        sections.push(`\n**${char.name}** (${char.role})`);
        if (char.personality) sections.push(`- Personality: ${char.personality}`);
        if (char.appearance) sections.push(`- Appearance: ${char.appearance}`);
        if (char.voiceNotes) sections.push(`- Voice: ${char.voiceNotes}`);
        if (char.relationships && char.relationships.length > 0) {
          const relStr = char.relationships
            .map((relationship) => `${relationship.character} (${relationship.type})`)
            .join(", ");
          sections.push(`- Relationships: ${relStr}`);
        }
      }
    }
  }

  if (bibleSections.world?.content) {
    const world = bibleSections.world.content as BibleWorldContent;
    sections.push("\n## World");
    if (world.setting) sections.push(`- Setting: ${world.setting}`);
    if (world.era) sections.push(`- Era: ${world.era}`);
    if (world.rules && world.rules.length > 0) {
      sections.push(`- Rules: ${world.rules.join("; ")}`);
    }
    if (world.locations && world.locations.length > 0) {
      sections.push(`- Locations: ${world.locations.join(", ")}`);
    }
    if (world.customs) sections.push(`- Customs: ${world.customs}`);
  }

  if (bibleSections.synopsis?.content) {
    const synopsis = bibleSections.synopsis.content as BibleSynopsisContent;
    if (synopsis.text) {
      sections.push("\n## Synopsis");
      sections.push(synopsis.text);
    }
  }

  if (bibleSections.genre?.content) {
    const genre = bibleSections.genre.content as BibleGenreContent;
    sections.push("\n## Genre");
    if (genre.primary) sections.push(`- Primary: ${genre.primary}`);
    if (genre.secondary && genre.secondary.length > 0) {
      sections.push(`- Secondary: ${genre.secondary.join(", ")}`);
    }
    if (genre.warnings && genre.warnings.length > 0) {
      sections.push(`- Warnings: ${genre.warnings.join(", ")}`);
    }
  }

  if (bibleSections.style_guide?.content) {
    const style = bibleSections.style_guide.content as BibleStyleGuideContent;
    sections.push("\n## Style Guide");
    if (style.pov) sections.push(`- POV: ${style.pov}`);
    if (style.tense) sections.push(`- Tense: ${style.tense}`);
    if (style.proseStyle) sections.push(`- Prose: ${style.proseStyle}`);
    if (style.dialogueStyle) sections.push(`- Dialogue: ${style.dialogueStyle}`);
    if (style.pacing) sections.push(`- Pacing: ${style.pacing}`);
  }

  if (bibleSections.outline?.content) {
    const outline = bibleSections.outline.content as BibleOutlineContent;
    if (outline.chapters && outline.chapters.length > 0) {
      sections.push("\n## Outline");
      for (const chapter of outline.chapters) {
        const parts = [
          `- Unit ${chapter.number}${chapter.title ? ` - ${chapter.title}` : ""}: ${chapter.summary} [${chapter.status}]`,
        ];

        if (chapter.intent) {
          parts.push(`  Intent: ${chapter.intent}`);
        }

        if (chapter.keyReveal) {
          parts.push(`  Key reveal: ${chapter.keyReveal}`);
        }

        if (chapter.openLoops && chapter.openLoops.length > 0) {
          parts.push(`  Open threads: ${chapter.openLoops.join("; ")}`);
        }

        sections.push(parts.join("\n"));
      }
    }
  }

  if (bibleSections.notes?.content) {
    const notes = normalizeNotesContent(
      bibleSections.notes.content as BibleNotesContent
    );
    const arcs = notes.arcs.filter(hasArcContent);
    const threads = notes.threads.filter(hasThreadContent);

    if (notes.text || arcs.length > 0 || threads.length > 0) {
      sections.push("\n## Notes");
      if (notes.text) {
        sections.push(notes.text);
      }

      if (arcs.length > 0) {
        sections.push("\n### Active Arcs");
        for (const arc of arcs) {
          const parts = [
            `- ${arc.title.trim() || "Untitled arc"} [${arc.status}]`,
          ];

          if (arc.intent.trim()) {
            parts.push(`  Intent: ${arc.intent.trim()}`);
          }

          if (arc.horizon?.trim()) {
            parts.push(`  Horizon: ${arc.horizon.trim()}`);
          }

          if (arc.notes?.trim()) {
            parts.push(`  Notes: ${arc.notes.trim()}`);
          }

          sections.push(parts.join("\n"));
        }
      }

      if (threads.length > 0) {
        sections.push("\n### Open Threads");
        for (const thread of threads) {
          const parts = [
            `- ${thread.title.trim() || "Untitled thread"} [${thread.status}]`,
          ];

          if (thread.owner?.trim()) {
            parts.push(`  Owner: ${thread.owner.trim()}`);
          }

          if (thread.introducedIn) {
            parts.push(`  Introduced in unit ${thread.introducedIn}`);
          }

          if (thread.targetUnit) {
            parts.push(`  Target payoff: unit ${thread.targetUnit}`);
          }

          if (thread.notes?.trim()) {
            parts.push(`  Notes: ${thread.notes.trim()}`);
          }

          sections.push(parts.join("\n"));
        }
      }
    }
  }

  return sections.join("\n");
}
