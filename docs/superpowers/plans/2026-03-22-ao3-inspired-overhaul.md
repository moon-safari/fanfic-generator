# AO3-Inspired Story Creation Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the story creation form with ~200+ fandoms, per-fandom character dropdowns, AO3-style rating/relationship selectors, preset tones, and categorized tropes.

**Architecture:** Split the monolithic `fandoms.ts` into per-category data files under `src/app/lib/fandoms/`. New UI components for each form section (CharacterSelector, RelationshipSelector, RatingSelector, ToneSelector). Updated prompts inject all new fields. localStorage migration handles backward compatibility.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Anthropic Claude API

**Spec:** `docs/superpowers/specs/2026-03-22-ao3-inspired-overhaul-design.md`

---

## File Structure

### Files to Create
| File | Responsibility |
|------|---------------|
| `src/app/lib/fandoms/books.ts` | Book fandom data (~20-30 fandoms) |
| `src/app/lib/fandoms/films-tv.ts` | Film & TV fandom data (~25-35 fandoms) |
| `src/app/lib/fandoms/anime.ts` | Anime & manga fandom data (~30-40 fandoms) |
| `src/app/lib/fandoms/games.ts` | Game fandom data (~25-35 fandoms) |
| `src/app/lib/fandoms/cartoons.ts` | Cartoon & animation fandom data (~15-20 fandoms) |
| `src/app/lib/fandoms/web-other.ts` | Web series & other fandom data (~10-15 fandoms) |
| `src/app/lib/fandoms/index.ts` | Re-exports, FANDOM_CATEGORIES, helper functions |
| `src/app/lib/fandoms/tropes.ts` | Categorized tropes data (TROPE_CATEGORIES) |
| `src/app/lib/fandoms/tones.ts` | Tone presets data (TONES) |
| `src/app/components/CharacterSelector.tsx` | 4 dropdowns with custom option per fandom |
| `src/app/components/RelationshipSelector.tsx` | Single-select button row (Gen/M\|M/F\|M/F\|F/Multi/Other) |
| `src/app/components/RatingSelector.tsx` | Single-select button row (General/Teen/Mature/Explicit) |
| `src/app/components/ToneSelector.tsx` | Multi-select pills max 2 with subtitles |

### Files to Modify
| File | Changes |
|------|---------|
| `src/app/types/story.ts` | Update Story, StoryFormData interfaces; remove plotTheme; add rating, relationshipType; characters→string[], tone→string[], setting→optional |
| `src/app/types/fandom.ts` | Update FandomConfig (add characters, settingPlaceholder), FandomCategory; expand category union; add TropeCategory type |
| `src/app/components/CreateStoryTab.tsx` | Replace form fields with new components; remove plotTheme; new validation; new Story construction |
| `src/app/components/FandomSelector.tsx` | Search input, accordion categories, 6 categories, mobile scroll |
| `src/app/components/TropeSelector.tsx` | Categorized tabs, ~40 tropes, import from new tropes.ts |
| `src/app/components/Library.tsx` | Show rating + relationship type in story cards |
| `src/app/lib/prompts.ts` | Inject rating, relationship type, character array, tone array; remove plotTheme |
| `src/app/lib/storage.ts` | Update exportStoryToText; add migration in getStories |
| `src/app/api/generate-story/route.ts` | Update validation for new required fields |
| `src/app/api/continue-chapter/route.ts` | Update validation for new Story shape |

### Files to Delete
| File | Reason |
|------|--------|
| `src/app/lib/fandoms.ts` | Replaced by `src/app/lib/fandoms/index.ts` and category files |

---

## Task 1: Update Type Definitions

**Files:**
- Modify: `src/app/types/fandom.ts`
- Modify: `src/app/types/story.ts`

- [ ] **Step 1: Update fandom types**

Replace the contents of `src/app/types/fandom.ts` with:

```typescript
export type FandomCategoryId = "books" | "films-tv" | "anime" | "games" | "cartoons" | "web-other";

export interface FandomConfig {
  id: string;
  name: string;
  category: FandomCategoryId;
  canonRules: string;
  locations: string;
  era?: string;
  characters: string[];
  settingPlaceholder: string;
}

export interface FandomCategory {
  id: FandomCategoryId;
  label: string;
  emoji: string;
  fandoms: FandomConfig[];
}

export interface TropeCategory {
  id: string;
  label: string;
  tropes: string[];
}

export interface ToneOption {
  id: string;
  label: string;
  subtitle: string;
}
```

- [ ] **Step 2: Update story types**

Replace the contents of `src/app/types/story.ts` with:

```typescript
export type RelationshipType = "gen" | "mm" | "fm" | "ff" | "multi" | "other";
export type Rating = "general" | "teen" | "mature" | "explicit";

export interface Story {
  id: string;
  title: string;
  chapters: string[];
  fandom: string;
  customFandom?: string;
  characters: string[];
  relationshipType: RelationshipType;
  rating: Rating;
  setting?: string;
  tone: string[];
  tropes: string[];
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

export interface StoryFormData {
  fandom: string;
  customFandom?: string;
  characters: string[];
  relationshipType: RelationshipType;
  rating: Rating;
  setting?: string;
  tone: string[];
  tropes: string[];
}

export interface GenerateResponse {
  title: string;
  chapter: string;
}

export interface ContinueResponse {
  chapter: string;
}
```

- [ ] **Step 3: Verify TypeScript compiles (expect errors in dependent files)**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: Type errors in files that still reference old shape (CreateStoryTab, prompts, etc.) — this is expected and will be fixed in later tasks.

- [ ] **Step 4: Commit**

```bash
git add src/app/types/story.ts src/app/types/fandom.ts
git commit -m "feat: update type definitions for AO3-inspired overhaul"
```

---

## Task 2: Create Tone and Trope Data Files

**Files:**
- Create: `src/app/lib/fandoms/tones.ts`
- Create: `src/app/lib/fandoms/tropes.ts`

- [ ] **Step 1: Create tones data**

Create `src/app/lib/fandoms/tones.ts`:

```typescript
import { ToneOption } from "../../types/fandom";

export const TONES: ToneOption[] = [
  { id: "fluff", label: "Fluff", subtitle: "Light, sweet, feel-good" },
  { id: "angst", label: "Angst", subtitle: "Emotional pain and suffering" },
  { id: "smut", label: "Smut", subtitle: "Explicit sexual content" },
  { id: "hurt-comfort", label: "Hurt/Comfort", subtitle: "Suffering followed by comfort" },
  { id: "crack", label: "Crack", subtitle: "Absurd, ridiculous humor" },
  { id: "darkfic", label: "Darkfic", subtitle: "Disturbing themes, no redemption" },
  { id: "whump", label: "Whump", subtitle: "Gratuitous character suffering" },
  { id: "slow-burn", label: "Slow Burn", subtitle: "Romance develops very gradually" },
  { id: "tooth-rotting-fluff", label: "Tooth-Rotting Fluff", subtitle: "Overwhelmingly sweet and sappy" },
  { id: "bittersweet", label: "Bittersweet", subtitle: "Happy and sad simultaneously" },
  { id: "character-study", label: "Character Study", subtitle: "Deep psychological exploration" },
  { id: "domestic", label: "Domestic", subtitle: "Everyday life, cozy scenarios" },
];
```

- [ ] **Step 2: Create categorized tropes data**

Create `src/app/lib/fandoms/tropes.ts`:

```typescript
import { TropeCategory } from "../../types/fandom";

export const TROPE_CATEGORIES: TropeCategory[] = [
  {
    id: "romance",
    label: "Romance",
    tropes: [
      "Enemies to Lovers",
      "Friends to Lovers",
      "Fake Dating / Fake Marriage",
      "Mutual Pining",
      "Forbidden Love",
      "Only One Bed",
      "Second Chance Romance",
      "Unrequited Love",
      "Idiots in Love",
      "Arranged Marriage",
    ],
  },
  {
    id: "au",
    label: "AU",
    tropes: [
      "Coffee Shop AU",
      "Modern AU",
      "Royalty AU",
      "College / High School AU",
      "Soulmate AU",
      "Omegaverse (A/B/O)",
      "No Powers AU",
      "Canon Divergence",
    ],
  },
  {
    id: "plot",
    label: "Plot",
    tropes: [
      "Time Travel",
      "Fix-It Fic",
      "Found Family",
      "Amnesia",
      "Body Swap",
      "Groundhog Day / Time Loop",
      "Secret Identity",
      "Identity Reveal",
      "Kidnapping / Rescue",
      "Reincarnation",
    ],
  },
  {
    id: "dynamics",
    label: "Dynamics",
    tropes: [
      "Hurt No Comfort",
      "Touch Starved",
      "Protective Behavior",
      "Possessive Behavior",
      "Jealousy",
      "BAMF Character",
      "Praise Kink",
      "Power Dynamics",
      "Competence Kink",
      "Caretaking",
    ],
  },
];

// Flat array of all tropes for validation
export const ALL_TROPES = TROPE_CATEGORIES.flatMap((cat) => cat.tropes);
```

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/fandoms/tones.ts src/app/lib/fandoms/tropes.ts
git commit -m "feat: add tone presets and categorized tropes data"
```

---

## Task 3: Create Fandom Data Files (Books, Films & TV)

**Files:**
- Create: `src/app/lib/fandoms/books.ts`
- Create: `src/app/lib/fandoms/films-tv.ts`

Each fandom needs: `id`, `name`, `category`, `canonRules` (1-2 sentences), `locations` (comma-separated), `era` (optional), `characters` (10-15 names), `settingPlaceholder` (one example).

- [ ] **Step 1: Create books fandom data**

Create `src/app/lib/fandoms/books.ts` with all book fandoms from the spec. Include at minimum:
Harry Potter, Lord of the Rings/Tolkien, Percy Jackson, Hunger Games, A Court of Thorns and Roses, Shadowhunter Chronicles, Six of Crows/Grishaverse, All For The Game, Les Miserables, The Raven Cycle, Red White & Royal Blue, His Dark Materials, The Locked Tomb, Fourth Wing, Twilight, A Song of Ice and Fire (book-specific tag separate from show).

Each fandom must follow the `FandomConfig` interface from `src/app/types/fandom.ts`. Use `category: "books"` for all.

Example entry for reference (migrate from existing `fandoms.ts`):
```typescript
import { FandomConfig } from "../../types/fandom";

export const BOOK_FANDOMS: FandomConfig[] = [
  {
    id: "harry-potter",
    name: "Harry Potter",
    category: "books",
    canonRules: "Follow Harry Potter canon. Use magical elements, proper spell incantations, Hogwarts houses and their traits. No modern technology like phones or internet. Magic follows established rules. Use British English.",
    locations: "Hogwarts, Diagon Alley, Hogsmeade, The Burrow, Grimmauld Place, Ministry of Magic, Forbidden Forest, Room of Requirement",
    era: "Can be set during any era (Founders, Marauders, Golden Trio, Next Gen)",
    characters: ["Harry Potter", "Hermione Granger", "Ron Weasley", "Draco Malfoy", "Severus Snape", "Luna Lovegood", "Ginny Weasley", "Neville Longbottom", "Sirius Black", "Remus Lupin", "Tom Riddle / Voldemort", "Albus Dumbledore", "Fred Weasley", "George Weasley", "Cedric Diggory"],
    settingPlaceholder: "e.g., Hogwarts library after hours, 6th year",
  },
  // ... all other book fandoms
];
```

- [ ] **Step 2: Create films & TV fandom data**

Create `src/app/lib/fandoms/films-tv.ts` with all film/TV fandoms. Include at minimum:
MCU/Marvel, Star Wars, Supernatural, Sherlock (BBC), Teen Wolf, Game of Thrones, Stranger Things, Good Omens, Hannibal, Wednesday, Merlin, The Umbrella Academy, Bridgerton, The 100, Our Flag Means Death, Buffy the Vampire Slayer, Doctor Who, Lucifer, Schitt's Creek, Ted Lasso, Top Gun, Criminal Minds, Glee, Shadowhunters, The Walking Dead, The Vampire Diaries, Shameless.

Use `category: "films-tv"` for all. Follow same structure as books.

- [ ] **Step 3: Verify both files import correctly**

Run: `npx tsc --noEmit 2>&1 | grep -E "books|films-tv" | head -5`
Expected: No import errors from these new files (other errors from unchanged files are OK).

- [ ] **Step 4: Commit**

```bash
git add src/app/lib/fandoms/books.ts src/app/lib/fandoms/films-tv.ts
git commit -m "feat: add book and film/TV fandom data (~50 fandoms)"
```

---

## Task 4: Create Fandom Data Files (Anime, Games, Cartoons, Web/Other)

**Files:**
- Create: `src/app/lib/fandoms/anime.ts`
- Create: `src/app/lib/fandoms/games.ts`
- Create: `src/app/lib/fandoms/cartoons.ts`
- Create: `src/app/lib/fandoms/web-other.ts`

- [ ] **Step 1: Create anime fandom data**

Create `src/app/lib/fandoms/anime.ts` with all anime/manga fandoms. Include at minimum:
My Hero Academia, Naruto, Attack on Titan, Haikyuu!!, Jujutsu Kaisen, One Piece, Demon Slayer, Bungou Stray Dogs, JoJo's Bizarre Adventure, Hetalia, Yuri!!! on Ice, Fullmetal Alchemist, Mob Psycho 100, Hunter x Hunter, Bleach, Death Note, Blue Lock, Tokyo Revengers, Fairy Tail, Detective Conan, Slam Dunk, SK8 the Infinity, InuYasha, Dragon Ball, Sailor Moon, Gintama, Kuroko's Basketball, Free!, Ace of Diamond, Black Butler.

Use `category: "anime"`. Export as `ANIME_FANDOMS: FandomConfig[]`.

- [ ] **Step 2: Create games fandom data**

Create `src/app/lib/fandoms/games.ts` with all game fandoms. Include at minimum:
Genshin Impact, Dragon Age, Baldur's Gate 3, Mass Effect, Honkai: Star Rail, The Witcher, Persona 5, Undertale, Fire Emblem: Three Houses, Final Fantasy VII, Final Fantasy XIV, Final Fantasy XV, Overwatch, Detroit: Become Human, Stardew Valley, Elder Scrolls/Skyrim, Fallout 4, Legend of Zelda (BotW/TotK), Red Dead Redemption, Resident Evil, Ace Attorney, Kingdom Hearts, Call of Duty, The Last of Us, Destiny, Team Fortress 2, World of Warcraft, Splatoon, Cookie Run.

Use `category: "games"`. Export as `GAME_FANDOMS: FandomConfig[]`.

- [ ] **Step 3: Create cartoons fandom data**

Create `src/app/lib/fandoms/cartoons.ts` with all cartoon/animation fandoms. Include at minimum:
Miraculous Ladybug, Avatar: The Last Airbender, Avatar: Legend of Korra, The Owl House, She-Ra (2018), Gravity Falls, Steven Universe, RWBY, Hazbin Hotel, Helluva Boss, Voltron, TMNT, Arcane, Frozen, Encanto, Danny Phantom, Transformers, LEGO Ninjago, Rise of the Guardians.

Use `category: "cartoons"`. Export as `CARTOON_FANDOMS: FandomConfig[]`.

- [ ] **Step 4: Create web series & other fandom data**

Create `src/app/lib/fandoms/web-other.ts` with all web/other fandoms. Include at minimum:
Homestuck, Danganronpa, Critical Role, The Magnus Archives, Sanders Sides, Hermitcraft, OMORI, Five Nights at Freddy's, Dungeons & Dragons, LEGO Monkie Kid, Red vs. Blue, The Adventure Zone, Check Please!.

Use `category: "web-other"`. Export as `WEB_OTHER_FANDOMS: FandomConfig[]`.

- [ ] **Step 5: Commit**

```bash
git add src/app/lib/fandoms/anime.ts src/app/lib/fandoms/games.ts src/app/lib/fandoms/cartoons.ts src/app/lib/fandoms/web-other.ts
git commit -m "feat: add anime, game, cartoon, and web fandom data (~150 fandoms)"
```

---

## Task 5: Create Fandom Index and Delete Old File

**Files:**
- Create: `src/app/lib/fandoms/index.ts`
- Delete: `src/app/lib/fandoms.ts`

- [ ] **Step 1: Create the new index file**

Create `src/app/lib/fandoms/index.ts`:

```typescript
import { FandomConfig, FandomCategory } from "../../types/fandom";
import { BOOK_FANDOMS } from "./books";
import { FILM_TV_FANDOMS } from "./films-tv";
import { ANIME_FANDOMS } from "./anime";
import { GAME_FANDOMS } from "./games";
import { CARTOON_FANDOMS } from "./cartoons";
import { WEB_OTHER_FANDOMS } from "./web-other";

export { TROPE_CATEGORIES, ALL_TROPES } from "./tropes";
export { TONES } from "./tones";

// Temporary backward-compat export — TropeSelector still imports TROPES until Task 8 rewrites it
export { ALL_TROPES as TROPES } from "./tropes";

const ALL_FANDOMS: FandomConfig[] = [
  ...BOOK_FANDOMS,
  ...FILM_TV_FANDOMS,
  ...ANIME_FANDOMS,
  ...GAME_FANDOMS,
  ...CARTOON_FANDOMS,
  ...WEB_OTHER_FANDOMS,
];

const FANDOM_MAP = new Map(ALL_FANDOMS.map((f) => [f.id, f]));

export const FANDOM_CATEGORIES: FandomCategory[] = [
  { id: "books", label: "Books", emoji: "\u{1F4DA}", fandoms: BOOK_FANDOMS },
  { id: "films-tv", label: "Films & TV", emoji: "\u{1F3AC}", fandoms: FILM_TV_FANDOMS },
  { id: "anime", label: "Anime & Manga", emoji: "\u{1F4FA}", fandoms: ANIME_FANDOMS },
  { id: "games", label: "Games", emoji: "\u{1F3AE}", fandoms: GAME_FANDOMS },
  { id: "cartoons", label: "Cartoons & Animation", emoji: "\u{1F3A8}", fandoms: CARTOON_FANDOMS },
  { id: "web-other", label: "Web Series & Other", emoji: "\u{1F310}", fandoms: WEB_OTHER_FANDOMS },
];

export function getFandomById(id: string): FandomConfig | undefined {
  return FANDOM_MAP.get(id);
}

export function getFandomContext(fandomId: string): string {
  const fandom = FANDOM_MAP.get(fandomId);
  if (!fandom) return "";
  return `UNIVERSE: ${fandom.name}
CANON RULES: ${fandom.canonRules}
KEY LOCATIONS: ${fandom.locations}
${fandom.era ? `ERA: ${fandom.era}` : ""}`;
}
```

- [ ] **Step 2: Delete old fandoms.ts**

Delete `src/app/lib/fandoms.ts`.

**Important:** All existing imports of `"../lib/fandoms"` will now resolve to `"../lib/fandoms/index.ts"` automatically because Node/TypeScript resolves directory imports to `index.ts`. The exports `FANDOM_CATEGORIES`, `getFandomById`, `getFandomContext` are preserved. A temporary `TROPES` re-export (aliased from `ALL_TROPES`) maintains backward compatibility with TropeSelector.tsx until Task 8 rewrites it. The re-export will be removed in Task 8.

- [ ] **Step 3: Verify imports resolve**

Run: `npx tsc --noEmit 2>&1 | head -10`
Expected: Errors from component files referencing old types (plotTheme, string vs string[], etc.) but NO errors about missing modules from fandoms imports.

- [ ] **Step 4: Commit**

```bash
git add src/app/lib/fandoms/ && git rm src/app/lib/fandoms.ts
git commit -m "feat: replace monolithic fandoms.ts with per-category data modules"
```

---

## Task 6: Update Storage with Migration

**Files:**
- Modify: `src/app/lib/storage.ts`

- [ ] **Step 1: Add migration function and update exports**

Replace `src/app/lib/storage.ts` with:

```typescript
import { Story } from "../types/story";

const STORAGE_KEY = "fanfic-stories";

// Migrate old story shape to new shape
function migrateStory(raw: Record<string, unknown>): Story {
  return {
    id: raw.id as string,
    title: raw.title as string,
    chapters: raw.chapters as string[],
    fandom: raw.fandom as string,
    customFandom: raw.customFandom as string | undefined,
    characters: Array.isArray(raw.characters)
      ? raw.characters
      : [raw.characters as string],
    relationshipType: (raw.relationshipType as Story["relationshipType"]) ?? "gen",
    rating: (raw.rating as Story["rating"]) ?? "mature",
    setting: (raw.setting as string) || undefined,
    tone: Array.isArray(raw.tone) ? raw.tone : [raw.tone as string],
    tropes: raw.tropes as string[],
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string,
    wordCount: raw.wordCount as number,
  };
}

export function getStories(): Story[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    return parsed.map(migrateStory);
  } catch {
    return [];
  }
}

export function saveStory(story: Story): void {
  const stories = getStories();
  const idx = stories.findIndex((s) => s.id === story.id);
  if (idx >= 0) {
    stories[idx] = story;
  } else {
    stories.unshift(story);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}

export function deleteStory(id: string): void {
  const stories = getStories().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}

export function exportStoryToText(story: Story): string {
  const lines = [`${story.title}\n`];
  if (story.fandom) lines.push(`Fandom: ${story.customFandom || story.fandom}`);
  lines.push(`Characters: ${story.characters.join(", ")}`);
  lines.push(`Relationship: ${story.relationshipType.toUpperCase()}`);
  lines.push(`Rating: ${story.rating.charAt(0).toUpperCase() + story.rating.slice(1)}`);
  if (story.setting) lines.push(`Setting: ${story.setting}`);
  lines.push(`Tone: ${story.tone.join(", ")}`);
  if (story.tropes.length) lines.push(`Tropes: ${story.tropes.join(", ")}`);
  lines.push(`\n${"—".repeat(40)}\n`);

  story.chapters.forEach((ch, i) => {
    lines.push(`Chapter ${i + 1}\n`);
    lines.push(ch);
    lines.push(`\n${"—".repeat(40)}\n`);
  });

  return lines.join("\n");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/lib/storage.ts
git commit -m "feat: add localStorage migration for new Story shape"
```

---

## Task 7: Create New UI Components (Rating, Relationship, Tone, Character Selectors)

**Files:**
- Create: `src/app/components/RatingSelector.tsx`
- Create: `src/app/components/RelationshipSelector.tsx`
- Create: `src/app/components/ToneSelector.tsx`
- Create: `src/app/components/CharacterSelector.tsx`

- [ ] **Step 1: Create RatingSelector**

Create `src/app/components/RatingSelector.tsx`:

```typescript
"use client";

import { Rating } from "../types/story";

const RATINGS: { value: Rating; label: string }[] = [
  { value: "general", label: "General" },
  { value: "teen", label: "Teen" },
  { value: "mature", label: "Mature" },
  { value: "explicit", label: "Explicit" },
];

interface RatingSelectorProps {
  selected: Rating;
  onChange: (rating: Rating) => void;
}

export default function RatingSelector({ selected, onChange }: RatingSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">Rating</label>
      <div className="flex flex-wrap gap-2">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selected === r.value
                ? "bg-purple-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create RelationshipSelector**

Create `src/app/components/RelationshipSelector.tsx`:

```typescript
"use client";

import { RelationshipType } from "../types/story";

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: "gen", label: "Gen" },
  { value: "mm", label: "M/M" },
  { value: "fm", label: "F/M" },
  { value: "ff", label: "F/F" },
  { value: "multi", label: "Multi" },
  { value: "other", label: "Other" },
];

interface RelationshipSelectorProps {
  selected: RelationshipType;
  onChange: (type: RelationshipType) => void;
}

export default function RelationshipSelector({ selected, onChange }: RelationshipSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">Relationship</label>
      <div className="flex flex-wrap gap-2">
        {RELATIONSHIP_TYPES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selected === r.value
                ? "bg-purple-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ToneSelector**

Create `src/app/components/ToneSelector.tsx`:

```typescript
"use client";

import { TONES } from "../lib/fandoms";

interface ToneSelectorProps {
  selected: string[];
  onChange: (tones: string[]) => void;
}

export default function ToneSelector({ selected, onChange }: ToneSelectorProps) {
  const toggle = (toneLabel: string) => {
    if (selected.includes(toneLabel)) {
      onChange(selected.filter((t) => t !== toneLabel));
    } else if (selected.length < 2) {
      onChange([...selected, toneLabel]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">
        Tone <span className="text-zinc-500">(pick up to 2)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {TONES.map((tone) => (
          <button
            key={tone.id}
            type="button"
            onClick={() => toggle(tone.label)}
            className={`flex flex-col items-start px-3 py-2 rounded-lg text-sm transition-colors ${
              selected.includes(tone.label)
                ? "bg-rose-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            <span className="font-medium">{tone.label}</span>
            <span className={`text-xs ${selected.includes(tone.label) ? "text-rose-200" : "text-zinc-500"}`}>
              {tone.subtitle}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create CharacterSelector**

Create `src/app/components/CharacterSelector.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { getFandomById } from "../lib/fandoms";

interface CharacterSelectorProps {
  fandom: string;
  characters: string[];
  onChange: (characters: string[]) => void;
}

export default function CharacterSelector({ fandom, characters, onChange }: CharacterSelectorProps) {
  const [customInputs, setCustomInputs] = useState<Record<number, boolean>>({});

  // Reset custom input toggles when fandom changes
  useEffect(() => {
    setCustomInputs({});
  }, [fandom]);

  const fandomData = getFandomById(fandom);
  const fandomCharacters = fandomData?.characters ?? [];
  const isCustomFandom = !fandomData; // custom or original — no dropdown

  const updateCharacter = (index: number, value: string) => {
    const next = [...characters];
    next[index] = value;
    onChange(next);
  };

  const toggleCustom = (index: number) => {
    setCustomInputs((prev) => ({ ...prev, [index]: !prev[index] }));
    updateCharacter(index, "");
  };

  const labels = [
    "Character 1 (required)",
    "Character 2 (required)",
    "Character 3 (optional)",
    "Character 4 (optional)",
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-300">Characters</label>
      {labels.map((label, i) => {
        const useCustom = isCustomFandom || customInputs[i];

        return (
          <div key={i}>
            <label className="block text-xs text-zinc-500 mb-1">{label}</label>
            {useCustom ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={characters[i] || ""}
                  onChange={(e) => updateCharacter(i, e.target.value)}
                  placeholder="Type character name..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
                {!isCustomFandom && (
                  <button
                    type="button"
                    onClick={() => toggleCustom(i)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 px-2"
                  >
                    List
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={characters[i] || ""}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      toggleCustom(i);
                    } else {
                      updateCharacter(i, e.target.value);
                    }
                  }}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select character...</option>
                  {fandomCharacters.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="__custom__">Custom...</option>
                </select>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/components/RatingSelector.tsx src/app/components/RelationshipSelector.tsx src/app/components/ToneSelector.tsx src/app/components/CharacterSelector.tsx
git commit -m "feat: add Rating, Relationship, Tone, and Character selector components"
```

---

## Task 8: Rework TropeSelector with Categorized Tabs

**Files:**
- Modify: `src/app/components/TropeSelector.tsx`
- Modify: `src/app/lib/fandoms/index.ts` (remove temporary `TROPES` re-export)

- [ ] **Step 0: Remove temporary TROPES re-export from fandoms/index.ts**

Delete this line from `src/app/lib/fandoms/index.ts`:
```typescript
// Temporary backward-compat export — TropeSelector still imports TROPES until Task 8 rewrites it
export { ALL_TROPES as TROPES } from "./tropes";
```

- [ ] **Step 1: Replace TropeSelector with categorized version**

Replace `src/app/components/TropeSelector.tsx` with:

```typescript
"use client";

import { useState } from "react";
import { TROPE_CATEGORIES } from "../lib/fandoms";

interface TropeSelectorProps {
  selected: string[];
  onChange: (tropes: string[]) => void;
}

export default function TropeSelector({ selected, onChange }: TropeSelectorProps) {
  const [activeTab, setActiveTab] = useState(TROPE_CATEGORIES[0].id);

  const toggle = (trope: string) => {
    if (selected.includes(trope)) {
      onChange(selected.filter((t) => t !== trope));
    } else if (selected.length < 6) {
      onChange([...selected, trope]);
    }
  };

  const activeCategory = TROPE_CATEGORIES.find((c) => c.id === activeTab)!;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-300">
        Tropes{" "}
        <span className="text-zinc-500">
          (optional, max 6 — {selected.length}/6 selected)
        </span>
      </label>

      <div className="flex gap-1 border-b border-zinc-800">
        {TROPE_CATEGORIES.map((cat) => {
          const count = selected.filter((t) => cat.tropes.includes(t)).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === cat.id
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {cat.label}
              {count > 0 && (
                <span className="ml-1 text-xs bg-rose-600 text-white px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {activeCategory.tropes.map((trope) => (
          <button
            key={trope}
            type="button"
            onClick={() => toggle(trope)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selected.includes(trope)
                ? "bg-rose-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {trope}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/TropeSelector.tsx
git commit -m "feat: rework TropeSelector with categorized tabs"
```

---

## Task 9: Rework FandomSelector with Search and Accordion

**Files:**
- Modify: `src/app/components/FandomSelector.tsx`

- [ ] **Step 1: Replace FandomSelector with search + accordion version**

Replace `src/app/components/FandomSelector.tsx` with:

```typescript
"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { FANDOM_CATEGORIES } from "../lib/fandoms";

interface FandomSelectorProps {
  selected: string;
  customFandom: string;
  onSelect: (id: string) => void;
  onCustomChange: (value: string) => void;
}

export default function FandomSelector({
  selected,
  customFandom,
  onSelect,
  onCustomChange,
}: FandomSelectorProps) {
  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const isSearching = search.length >= 2;

  const filteredCategories = useMemo(() => {
    if (!isSearching) return FANDOM_CATEGORIES;
    const q = search.toLowerCase();
    return FANDOM_CATEGORIES.map((cat) => ({
      ...cat,
      fandoms: cat.fandoms.filter((f) => f.name.toLowerCase().includes(q)),
    })).filter((cat) => cat.fandoms.length > 0);
  }, [search, isSearching]);

  const toggleCategory = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Find which category the selected fandom belongs to
  const selectedCategory = FANDOM_CATEGORIES.find((cat) =>
    cat.fandoms.some((f) => f.id === selected)
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-300">
        Choose a Universe
      </label>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search fandoms..."
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-purple-500"
      />

      <div className="max-h-80 overflow-y-auto space-y-1 rounded-lg">
        {filteredCategories.map((cat) => {
          const isExpanded = isSearching || expandedCats.has(cat.id) || selectedCategory?.id === cat.id;

          return (
            <div key={cat.id} className="border border-zinc-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
              >
                <span>
                  {cat.emoji} {cat.label}
                  <span className="ml-1 text-xs text-zinc-600">({cat.fandoms.length})</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded && (
                <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                  {cat.fandoms.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onSelect(f.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selected === f.id
                          ? "bg-purple-600 text-white"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => onSelect("custom")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            selected === "custom"
              ? "bg-purple-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Custom
        </button>
        <button
          type="button"
          onClick={() => onSelect("")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            selected === ""
              ? "bg-purple-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Original Story
        </button>
      </div>

      {selected === "custom" && (
        <input
          type="text"
          value={customFandom}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="Enter your fandom (e.g., Twilight, One Piece...)"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/FandomSelector.tsx
git commit -m "feat: rework FandomSelector with search and accordion categories"
```

---

## Task 10: Rework CreateStoryTab

**Files:**
- Modify: `src/app/components/CreateStoryTab.tsx`

- [ ] **Step 1: Replace CreateStoryTab with new form layout**

Replace `src/app/components/CreateStoryTab.tsx` with:

```typescript
"use client";

import { useState, useCallback } from "react";
import { v4 as uuid } from "uuid";
import { Sparkles, Loader2 } from "lucide-react";
import FandomSelector from "./FandomSelector";
import CharacterSelector from "./CharacterSelector";
import RelationshipSelector from "./RelationshipSelector";
import RatingSelector from "./RatingSelector";
import ToneSelector from "./ToneSelector";
import TropeSelector from "./TropeSelector";
import { Story, StoryFormData, GenerateResponse, RelationshipType, Rating } from "../types/story";
import { getFandomById } from "../lib/fandoms";
import { saveStory } from "../lib/storage";

interface CreateStoryTabProps {
  onStoryCreated: (story: Story) => void;
}

export default function CreateStoryTab({ onStoryCreated }: CreateStoryTabProps) {
  const [fandom, setFandom] = useState("");
  const [customFandom, setCustomFandom] = useState("");
  const [characters, setCharacters] = useState<string[]>(["", "", "", ""]);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("gen");
  const [rating, setRating] = useState<Rating>("mature");
  const [setting, setSetting] = useState("");
  const [tone, setTone] = useState<string[]>([]);
  const [tropes, setTropes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // At least 2 characters filled in, at least 1 tone
  const filledCharacters = characters.filter((c) => c.trim().length >= 2);
  const canSubmit = filledCharacters.length >= 2 && tone.length >= 1 && !loading;

  const handleFandomChange = useCallback((id: string) => {
    setFandom(id);
    // Reset characters when fandom changes
    setCharacters(["", "", "", ""]);
  }, []);

  const fandomData = getFandomById(fandom);
  const settingPlaceholder = fandomData?.settingPlaceholder || "Describe your setting...";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    const formData: StoryFormData = {
      fandom: fandom === "custom" ? "" : fandom,
      customFandom: fandom === "custom" ? customFandom : undefined,
      characters: characters.filter((c) => c.trim().length > 0),
      relationshipType,
      rating,
      setting: setting.trim() || undefined,
      tone,
      tropes,
    };

    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate story");
      }

      const data: GenerateResponse = await res.json();
      const wordCount = data.chapter.split(/\s+/).length;

      const story: Story = {
        id: uuid(),
        title: data.title,
        chapters: [data.chapter],
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount,
      };

      saveStory(story);
      onStoryCreated(story);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <FandomSelector
        selected={fandom}
        customFandom={customFandom}
        onSelect={handleFandomChange}
        onCustomChange={setCustomFandom}
      />

      <CharacterSelector
        fandom={fandom}
        characters={characters}
        onChange={setCharacters}
      />

      <RelationshipSelector
        selected={relationshipType}
        onChange={setRelationshipType}
      />

      <RatingSelector selected={rating} onChange={setRating} />

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Setting <span className="text-zinc-500">(optional)</span>
        </label>
        <input
          type="text"
          value={setting}
          onChange={(e) => setSetting(e.target.value)}
          placeholder={settingPlaceholder}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      <ToneSelector selected={tone} onChange={setTone} />

      <TropeSelector selected={tropes} onChange={setTropes} />

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-purple-600 hover:bg-purple-500 active:bg-purple-700"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Crafting your story...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Start My Story
          </>
        )}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/CreateStoryTab.tsx
git commit -m "feat: rework CreateStoryTab with all new form components"
```

---

## Task 11: Update Prompts

**Files:**
- Modify: `src/app/lib/prompts.ts`

- [ ] **Step 1: Replace prompts with updated versions**

Replace `src/app/lib/prompts.ts` with:

```typescript
import { StoryFormData, Story, Rating, RelationshipType } from "../types/story";
import { getFandomContext } from "./fandoms";

function getRatingInstructions(rating: Rating): string {
  switch (rating) {
    case "general":
      return "CONTENT RATING: General. Keep content suitable for all ages. No violence, sexual content, or strong language.";
    case "teen":
      return "CONTENT RATING: Teen. Mild violence and implied romance are acceptable. No explicit sexual content.";
    case "mature":
      return "CONTENT RATING: Mature. Adult themes, moderate violence, sexual tension allowed. Fade to black for sexual content.";
    case "explicit":
      return "CONTENT RATING: Explicit. No restrictions. Graphic sexual content, violence, and dark themes are fully permitted. Do NOT fade to black.";
  }
}

function getRelationshipInstructions(type: RelationshipType, characters: string[]): string {
  const char1 = characters[0] || "Character 1";
  const char2 = characters[1] || "Character 2";
  switch (type) {
    case "gen":
      return "RELATIONSHIP: Gen (no romantic focus). Focus on plot, friendship, and character dynamics rather than romance.";
    case "mm":
      return `RELATIONSHIP: M/M. Write romantic and/or sexual tension between ${char1} and ${char2} as a male/male pairing.`;
    case "fm":
      return `RELATIONSHIP: F/M. Write romantic and/or sexual tension between ${char1} and ${char2} as a female/male pairing.`;
    case "ff":
      return `RELATIONSHIP: F/F. Write romantic and/or sexual tension between ${char1} and ${char2} as a female/female pairing.`;
    case "multi":
      return `RELATIONSHIP: Multi/Polyamorous. Write romantic dynamics involving multiple characters: ${characters.filter(Boolean).join(", ")}.`;
    case "other":
      return `RELATIONSHIP: Other. Write the relationship between ${char1} and ${char2} as the story demands, without assumptions about gender.`;
  }
}

export function buildChapter1Prompt(form: StoryFormData): string {
  const fandomCtx = getFandomContext(form.fandom);
  const fandomName = form.customFandom || form.fandom || "Original";
  const toneStr = form.tone.join(" + ");

  return `You are a skilled creative fiction writer specializing in ${fandomName} stories. You write vivid, emotionally gripping fiction.

${getRatingInstructions(form.rating)}

${getRelationshipInstructions(form.relationshipType, form.characters)}

${fandomCtx ? fandomCtx : "This is an original story. Build an immersive world from the user's inputs."}

Write Chapter 1 for a new story with these specifications:

STORY CONFIGURATION:
- Characters: ${form.characters.filter(Boolean).join(", ")}
${form.setting ? `- Setting: ${form.setting}` : ""}
- Tone: ${toneStr}
${form.tropes.length > 0 ? `- Tropes: ${form.tropes.join(", ")}` : ""}

TITLE GENERATION:
First, generate a compelling story title that:
- Captures the essence of the story
- Reflects the ${toneStr} tone
- Is memorable and evocative
- Is 2-6 words long

CHAPTER 1 INSTRUCTIONS:
1. Write approximately 3-4 paragraphs (400-600 words)
2. Start with a compelling hook — the first sentence should grab
3. Introduce characters naturally through action and dialogue
4. Establish setting vividly using sensory detail
5. Create tension, desire, or intrigue
6. End with a cliffhanger or irresistible hook for Chapter 2
7. Match the "${toneStr}" tone throughout
8. Show, don't tell — use action, dialogue, and body language
${fandomCtx ? `9. Stay true to ${fandomName} canon` : "9. Build an immersive world"}
10. Incorporate selected tropes naturally — weave them in, don't announce them
11. Do NOT hold back on intensity. If the tone calls for heat, write heat. If it calls for darkness, write darkness.

OUTPUT FORMAT (follow exactly):
Title: [Generated Title]

[Chapter 1 text — no "Chapter 1" header, just the story text]`;
}

export function buildContinuationPrompt(story: Story, chapterNum: number): string {
  const fandomCtx = getFandomContext(story.fandom);
  const fandomName = story.customFandom || story.fandom || "Original";
  const toneStr = story.tone.join(" + ");
  const rating = story.rating ?? "mature";
  const relationshipType = story.relationshipType ?? "gen";

  const chapterHistory = story.chapters
    .map((ch, i) => `--- Chapter ${i + 1} ---\n${ch}`)
    .join("\n\n");

  return `You are continuing a serialised ${fandomName} story. You write vivid, emotionally gripping fiction.

${getRatingInstructions(rating)}

${getRelationshipInstructions(relationshipType, story.characters)}

${fandomCtx}

STORY DETAILS:
- Title: "${story.title}"
- Characters: ${story.characters.filter(Boolean).join(", ")}
${story.setting ? `- Setting: ${story.setting}` : ""}
- Tone: ${toneStr}
${story.tropes.length > 0 ? `- Tropes: ${story.tropes.join(", ")}` : ""}

PREVIOUS CHAPTERS:
${chapterHistory}

CHAPTER ${chapterNum} INSTRUCTIONS:
1. Continue DIRECTLY from where Chapter ${chapterNum - 1} ended
2. Remember and reference previous events — continuity is sacred
3. Maintain character voices and consistency
4. Advance the plot meaningfully — something must change or deepen
5. Maintain the established tone
6. End with a compelling hook or cliffhanger — make them NEED to click Continue
7. Write approximately 3-4 paragraphs (400-600 words)
8. Show character growth or shift in dynamics
9. Do NOT summarise previous chapters — jump straight into the action
10. Do NOT hold back on intensity. Match or escalate the established tone.

Write Chapter ${chapterNum} now (just the story text, no chapter header):`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/lib/prompts.ts
git commit -m "feat: update prompts with rating, relationship, and character array support"
```

---

## Task 12: Update API Routes

**Files:**
- Modify: `src/app/api/generate-story/route.ts`
- Modify: `src/app/api/continue-chapter/route.ts`

- [ ] **Step 1: Update generate-story validation**

Replace the validation block in `src/app/api/generate-story/route.ts` (lines 10-17) with:

```typescript
    const body: StoryFormData = await req.json();

    if (
      !body.characters ||
      !Array.isArray(body.characters) ||
      body.characters.filter((c: string) => c.trim().length > 0).length < 2 ||
      !body.tone ||
      !Array.isArray(body.tone) ||
      body.tone.length < 1 ||
      !body.rating ||
      !body.relationshipType
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
```

- [ ] **Step 2: Update continue-chapter — no changes needed beyond types**

The continue-chapter route passes `story` directly to `buildContinuationPrompt`, which now handles the new shape. The `Story` type import already reflects the new shape. No code changes needed — just verify it compiles.

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors (all type mismatches should now be resolved).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/generate-story/route.ts
git commit -m "feat: update generate-story API validation for new form fields"
```

---

## Task 13: Update Library Component

**Files:**
- Modify: `src/app/components/Library.tsx`

- [ ] **Step 1: Add rating and relationship type to story cards**

In `src/app/components/Library.tsx`, update the metadata line (around line 44-48) to include rating and relationship type:

Replace:
```typescript
                <p className="text-sm text-zinc-500 mt-1">
                  {fandomLabel} · {story.chapters.length} chapter
                  {story.chapters.length !== 1 ? "s" : ""} ·{" "}
                  {story.wordCount.toLocaleString()} words
                </p>
```

With:
```typescript
                <p className="text-sm text-zinc-500 mt-1">
                  {fandomLabel} · {story.rating?.toUpperCase() || "MATURE"} · {story.relationshipType?.toUpperCase() || "GEN"} · {story.chapters.length} ch · {story.wordCount.toLocaleString()} words
                </p>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/Library.tsx
git commit -m "feat: show rating and relationship type in library cards"
```

---

## Task 14: Full Integration Test

- [ ] **Step 1: Verify TypeScript compiles clean**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Verify dev server starts**

Run: `npm run dev` (should already be running)
Expected: Server starts without errors. Visit http://localhost:3000.

- [ ] **Step 3: Manual smoke test checklist**

1. Fandom selector shows 6 categories in accordion
2. Search filters fandoms across categories
3. Selecting a fandom populates character dropdowns
4. Changing fandom resets character selections
5. Character "Custom..." option reveals text input
6. Custom/Original fandom shows all text inputs for characters
7. Relationship and Rating selectors work (single-select)
8. Tone selector allows max 2 selections with subtitles visible
9. Trope tabs switch correctly, selections persist across tabs, max 6
10. "Start My Story" button enabled when 2+ characters + 1+ tone
11. Story generates successfully with new fields
12. Library shows rating + relationship type
13. "Continue Story" works with existing story
14. Export to text includes new fields

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: integration fixes from smoke testing"
```
