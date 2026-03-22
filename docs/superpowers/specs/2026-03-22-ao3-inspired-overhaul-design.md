# AO3-Inspired Story Creation Overhaul

## Summary

Overhaul the story creation form to match Archive of Our Own's filtering depth. Expand from 16 fandoms to ~200+ (every AO3 fandom with 10,000+ works, deduplicated by franchise). Add per-fandom character dropdowns, AO3-style rating and relationship type selectors, preset tone options, and categorized tropes.

## Current State

The form currently has:
- Fandom selector (16 fandoms in 4 categories + Custom + Original)
- Free-text fields: Characters, Setting, Plot Theme, Tone
- Trope selector: 16 tropes, flat list, max 6
- Each fandom has: `id`, `name`, `category`, `canonRules`, `locations`, `era`

## Changes

### 1. Fandom Data Expansion (~200+ fandoms)

Every AO3 fandom with 10,000+ works, deduplicated by franchise. Excludes RPF (Real Person Fiction) tags — legally risky for AI-generated content.

Each fandom entry gains a new field:
```typescript
characters: string[] // 10-15 key characters per fandom
```

**Categories expand from 4 to 6:**
- Books
- Films & TV
- Anime & Manga
- Games
- Cartoons & Animation
- Web Series & Other

Full fandom list derived from AO3 stats (Feb 2025, destinationtoast dataset). Examples per category:

**Books:** Harry Potter, LOTR/Tolkien, Percy Jackson, Hunger Games, A Court of Thorns and Roses, Shadowhunter Chronicles, Six of Crows/Grishaverse, All For The Game, Les Miserables, The Raven Cycle, Red White & Royal Blue, etc.

**Films & TV:** MCU/Marvel, Star Wars, Supernatural, Sherlock (BBC), Teen Wolf, Game of Thrones/ASOIAF, Stranger Things, Good Omens, Hannibal, Wednesday, Merlin, The Umbrella Academy, Bridgerton, The 100, Our Flag Means Death, Buffy, Doctor Who, Lucifer, Schitt's Creek, Ted Lasso, Top Gun, etc.

**Anime & Manga:** MHA, Naruto, Attack on Titan, Haikyuu!!, Jujutsu Kaisen, One Piece, Demon Slayer, Bungou Stray Dogs, JoJo's Bizarre Adventure, Hetalia, Yuri on Ice, Fullmetal Alchemist, Mob Psycho 100, Hunter x Hunter, Bleach, Death Note, Blue Lock, Tokyo Revengers, Fairy Tail, Detective Conan, Slam Dunk, SK8, InuYasha, Dragon Ball, Sailor Moon, Gintama, etc.

**Games:** Genshin Impact, Dragon Age, Baldur's Gate 3, Mass Effect, Honkai: Star Rail, The Witcher, Persona 5, Undertale, Fire Emblem: Three Houses, Final Fantasy (VII, XIV, XV), Overwatch, Detroit: Become Human, Stardew Valley, Elder Scrolls/Skyrim, Fallout, Legend of Zelda, Red Dead Redemption, Resident Evil, Ace Attorney, Kingdom Hearts, Call of Duty, The Last of Us, etc.

**Cartoons & Animation:** Miraculous Ladybug, Avatar: The Last Airbender, The Owl House, She-Ra (2018), Gravity Falls, Steven Universe, RWBY, Hazbin Hotel, Helluva Boss, Voltron, TMNT, Arcane, Frozen, Encanto, Danny Phantom, etc.

**Web Series & Other:** Homestuck, Danganronpa, Critical Role, The Magnus Archives, Sanders Sides, Hermitcraft, OMORI, Five Nights at Freddy's, Dungeons & Dragons, etc.

### 2. Character Selector (new component: `CharacterSelector.tsx`)

Replaces the free-text "Characters" field.

- **4 dropdown fields:** Character 1 & 2 (required), Character 3 & 4 (optional)
- Each dropdown populated from the selected fandom's `characters[]` array
- Each dropdown includes a **"Custom..."** option at the bottom — selecting it reveals a text input
- For **Custom** or **Original Story** fandoms: all 4 fields are freeform text (no dropdown)
- Labels: "Character 1 (required)", "Character 2 (required)", "Character 3 (optional)", "Character 4 (optional)"

### 3. Relationship Type (new component: `RelationshipSelector.tsx`)

Single-select button row. **Required, defaults to "Gen".**

Options: **Gen** | **M/M** | **F/M** | **F/F** | **Multi** | **Other**

Mirrors AO3's category system exactly.

### 4. Rating (new component: `RatingSelector.tsx`)

Single-select button row. **Required, defaults to "Mature".**

Options: **General** | **Teen** | **Mature** | **Explicit**

Maps to AO3's rating tiers. Controls content intensity in the AI prompt:
- General: No violence, no sexual content, suitable for all ages
- Teen: Mild violence, implied romance, some language
- Mature: Adult themes, moderate violence, sexual tension, fade-to-black
- Explicit: Graphic content — sex, violence, dark themes fully rendered

### 5. Setting (existing field, modified)

- Changes from **required** to **optional**
- Fandom-specific placeholder text (e.g., "Hogwarts Great Hall at midnight" for Harry Potter, "The Hanged Man, Kirkwall" for Dragon Age)
- Placeholder stored per-fandom in `fandoms.ts` as `settingPlaceholder: string`
- For Custom/Original: generic placeholder "Describe your setting..."

### 6. Tone Selector (reworked component: `ToneSelector.tsx`)

Replaces free-text tone input with **preset pill/button options**.

**Multi-select, max 2.** Fanfic tones naturally come in pairs (e.g., Angst + Slow Burn).

Options (12 tones):
| Tone | Description (shown on hover/tap) |
|------|----------------------------------|
| Fluff | Light, sweet, feel-good |
| Angst | Emotional pain and suffering |
| Smut | Explicit sexual content |
| Hurt/Comfort | Suffering followed by comfort |
| Crack | Absurd, ridiculous humor |
| Darkfic | Disturbing themes, no redemption |
| Whump | Gratuitous character suffering |
| Slow Burn | Romance develops very gradually |
| Tooth-Rotting Fluff | Overwhelmingly sweet and sappy |
| Bittersweet | Happy and sad simultaneously |
| Character Study | Deep psychological exploration |
| Domestic | Everyday life, cozy scenarios |

### 7. Trope Selector (reworked component: `TropeSelector.tsx`)

Categorized tabs replacing flat list. **Max 6 selections** across all categories. ~40 tropes total.

**Tab: Romance (10)**
- Enemies to Lovers
- Friends to Lovers
- Fake Dating / Fake Marriage
- Mutual Pining
- Forbidden Love
- Only One Bed
- Second Chance Romance
- Unrequited Love
- Idiots in Love
- Arranged Marriage

**Tab: AU (8)**
- Coffee Shop AU
- Modern AU
- Royalty AU
- College / High School AU
- Soulmate AU
- Omegaverse (A/B/O)
- No Powers AU
- Canon Divergence

**Tab: Plot (10)**
- Time Travel
- Fix-It Fic
- Found Family
- Amnesia
- Body Swap
- Groundhog Day / Time Loop
- Secret Identity
- Identity Reveal
- Kidnapping / Rescue
- Reincarnation

**Tab: Dynamics (10)**
- Hurt No Comfort
- Touch Starved
- Protective Behavior
- Possessive Behavior
- Jealousy
- BAMF Character
- Praise Kink
- Power Dynamics
- Competence Kink
- Caretaking

### 8. Plot Theme Field

**Removed.** Tropes + Tone cover this territory completely.

### 9. Form Layout (top to bottom)

1. **Fandom** — categorized button grid (scrollable within each category)
2. **Characters** — 4 dropdowns (2 required, 2 optional)
3. **Relationship Type** — button row (required, default Gen)
4. **Rating** — button row (required, default Mature)
5. **Setting** — optional freeform text with fandom placeholder
6. **Tone** — preset pills, multi-select max 2
7. **Tropes** — categorized tabs, multi-select max 6
8. **"Start My Story"** button

### 10. Type Changes

```typescript
// Updated StoryFormData
interface StoryFormData {
  fandom: string;
  customFandom?: string;
  characters: string[];        // Changed from single string to array of 2-4
  relationshipType: 'gen' | 'mm' | 'fm' | 'ff' | 'multi' | 'other';
  rating: 'general' | 'teen' | 'mature' | 'explicit';
  setting?: string;            // Now optional
  tone: string[];              // Changed from string to array (max 2)
  tropes: string[];
}

// Updated Fandom type
interface Fandom {
  id: string;
  name: string;
  category: 'books' | 'films-tv' | 'anime' | 'games' | 'cartoons' | 'web-other';
  canonRules: string;
  locations: string;
  era?: string;
  characters: string[];        // NEW: 10-15 per fandom
  settingPlaceholder: string;  // NEW: fandom-specific placeholder
}
```

### 11. Prompt Updates (`prompts.ts`)

Both `buildChapter1Prompt` and `buildContinuationPrompt` updated to include:

- **Rating** → controls content intensity instructions
  - General: "Keep content suitable for all ages. No violence, sexual content, or strong language."
  - Teen: "Mild violence and implied romance are acceptable. No explicit content."
  - Mature: "Adult themes, moderate violence, sexual tension allowed. Fade to black for sexual content."
  - Explicit: "No restrictions. Graphic sexual content, violence, and dark themes are fully permitted."
- **Relationship Type** → tells AI the pairing dynamics
  - "The primary relationship dynamic is [type]. Write romantic/sexual tension between [Character 1] and [Character 2] accordingly." (For Gen: "This is a general/non-romantic story. Focus on plot, friendship, and character dynamics rather than romance.")
- **Characters** → now passed as structured array instead of free text
- **Tone** → up to 2 tones passed as descriptors
- **Setting** → passed if provided, otherwise AI chooses based on fandom

### 12. API Route Changes

- `generate-story/route.ts`: Update validation for new required fields (characters array length >= 2, relationshipType, rating). Setting becomes optional. Theme removed.
- `continue-chapter/route.ts`: No structural changes needed — it receives the full Story object which will contain the new fields.

### 13. Storage & Library Updates

- `storage.ts`: No changes needed (stores whatever Story object shape is passed)
- `Library.tsx`: Update metadata display to show rating, relationship type alongside fandom/tropes
- `StoryViewer.tsx`: No changes needed

### 14. FandomSelector Updates

- Add 2 new categories to the button grid: "Cartoons & Animation", "Web Series & Other"
- Scrollable within each category for mobile (horizontal scroll or collapsible)
- With ~200 fandoms, add a **search/filter text input** at the top of the fandom selector to quickly find a fandom by name

## Files Changed

| File | Change |
|------|--------|
| `src/app/lib/fandoms.ts` | Expand to ~200+ fandoms with characters + settingPlaceholder |
| `src/app/types/index.ts` | Update StoryFormData, Fandom, Story interfaces |
| `src/app/components/CreateStoryTab.tsx` | New form layout, remove theme, add new fields |
| `src/app/components/FandomSelector.tsx` | 6 categories, search input, ~200 fandoms |
| `src/app/components/CharacterSelector.tsx` | **NEW** — 4 dropdowns with custom option |
| `src/app/components/RelationshipSelector.tsx` | **NEW** — single-select button row |
| `src/app/components/RatingSelector.tsx` | **NEW** — single-select button row |
| `src/app/components/ToneSelector.tsx` | **NEW** — replaces free-text, preset pills max 2 |
| `src/app/components/TropeSelector.tsx` | Categorized tabs, expanded to ~40 tropes |
| `src/app/lib/prompts.ts` | Inject rating, relationship, structured characters |
| `src/app/api/generate-story/route.ts` | Update validation for new fields |
| `src/app/api/continue-chapter/route.ts` | Minor updates for new Story shape |
| `src/app/components/Library.tsx` | Show rating + relationship type in cards |

## Out of Scope

- User accounts / authentication
- Server-side story storage (stays localStorage)
- Content moderation / filtering
- RPF (Real Person Fiction) fandoms — excluded for legal reasons
- Fandom artwork / images
