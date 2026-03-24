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

export function buildBibleGenerationPrompt(chapter1: string, fandomContext: string): string {
  return `You are a story bible analyst. Extract a comprehensive Story Bible from the provided Chapter 1 text.
${fandomContext ? `\nFANDOM CONTEXT:\n${fandomContext}\n` : ""}
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
        "status": "written"
      }
    ]
  },
  "notes": {
    "text": "Any additional notable details, themes, or craft observations"
  }
}

CHAPTER 1 TEXT:
${chapter1}`;
}

export function formatBibleForPrompt(bible: StoryBible): string {
  const sections: string[] = ["=== STORY BIBLE ==="];

  const { sections: bibleSections } = bible;

  // Characters
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
            .map((r) => `${r.character} (${r.type})`)
            .join(", ");
          sections.push(`- Relationships: ${relStr}`);
        }
      }
    }
  }

  // World
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

  // Synopsis
  if (bibleSections.synopsis?.content) {
    const synopsis = bibleSections.synopsis.content as BibleSynopsisContent;
    if (synopsis.text) {
      sections.push("\n## Synopsis");
      sections.push(synopsis.text);
    }
  }

  // Genre
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

  // Style Guide
  if (bibleSections.style_guide?.content) {
    const style = bibleSections.style_guide.content as BibleStyleGuideContent;
    sections.push("\n## Style Guide");
    if (style.pov) sections.push(`- POV: ${style.pov}`);
    if (style.tense) sections.push(`- Tense: ${style.tense}`);
    if (style.proseStyle) sections.push(`- Prose: ${style.proseStyle}`);
    if (style.dialogueStyle) sections.push(`- Dialogue: ${style.dialogueStyle}`);
    if (style.pacing) sections.push(`- Pacing: ${style.pacing}`);
  }

  // Outline (brief)
  if (bibleSections.outline?.content) {
    const outline = bibleSections.outline.content as BibleOutlineContent;
    if (outline.chapters && outline.chapters.length > 0) {
      sections.push("\n## Chapter Outline");
      for (const ch of outline.chapters) {
        sections.push(`- Chapter ${ch.number}${ch.title ? ` — ${ch.title}` : ""}: ${ch.summary} [${ch.status}]`);
      }
    }
  }

  // Notes
  if (bibleSections.notes?.content) {
    const notes = bibleSections.notes.content as BibleNotesContent;
    if (notes.text) {
      sections.push("\n## Notes");
      sections.push(notes.text);
    }
  }

  return sections.join("\n");
}
