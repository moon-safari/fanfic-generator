import type {
  MemoryChangeSuggestionPayload,
  MemoryChangeType,
  MemoryCustomField,
  MemorySuggestionConfidence,
  MemorySuggestionStatus,
  CreateMemoryCustomTypeInput,
  CreateMemoryEntryInput,
  CreateMemoryProgressionInput,
} from "../../types/memory";
import type { Story } from "../../types/story";

type ChapterSeed = {
  chapterNumber: number;
  content: string;
  summary: string;
};

type CustomTypeSeed = CreateMemoryCustomTypeInput;

type EntrySeed = CreateMemoryEntryInput & {
  key: string;
};

type RelationshipSeed = {
  sourceKey: string;
  targetKey: string;
  forwardLabel: string;
  reverseLabel: string;
};

type ProgressionSeed = CreateMemoryProgressionInput & {
  entryKey: string;
};

type SuggestionSeed = {
  chapterNumber: number;
  targetEntryKey?: string;
  changeType: MemoryChangeType;
  payload: MemoryChangeSuggestionPayload;
  evidenceText?: string;
  rationale?: string;
  confidence?: MemorySuggestionConfidence;
  status?: MemorySuggestionStatus;
  reviewedAt?: string;
  appliedAt?: string;
};

export const MEMORY_SHOWCASE_TITLE = "Memory Showcase: The Glass Archive";
export const MEMORY_SHOWCASE_CUSTOM_FANDOM = "Original Showcase";

export const MEMORY_SHOWCASE_STORY = {
  title: MEMORY_SHOWCASE_TITLE,
  fandom: "",
  customFandom: MEMORY_SHOWCASE_CUSTOM_FANDOM,
  characters: ["Mara Voss", "Iven Vale", "Sister Cal", "The Quiet Order"],
  relationshipType: "gen" as const,
  rating: "mature" as const,
  setting:
    "A drowned archive-city where memories can be woven into glass and every sealed room carries a price.",
  tone: ["atmospheric", "mysterious", "tense"],
  tropes: [
    "forbidden magic",
    "secret archives",
    "fractured loyalty",
    "slow-burn trust",
  ],
};

export const MEMORY_SHOWCASE_CHAPTERS: ChapterSeed[] = [
  {
    chapterNumber: 1,
    summary:
      "Mara steals a living ledger from the Glass Archive and discovers the Star-Key is tied to an old prophecy naming her. Iven shadows her through the flooded stacks and learns the Quiet Order is already hunting them both.",
    content: `Mara Voss knew the Glass Archive by the sound it made before dawn. The whole place breathed through its flooded lower vaults, a slow mineral hush that pressed against the catwalks and left the air tasting of salt and rusted bells. She slipped between hanging lanterns with the ledger tucked under one arm and the stolen lamp under the other, following the old maintenance marks toward the sealed east galleries.

The ledger was not supposed to exist. Every page remembered the hand that touched it last, and when Mara opened it beneath the cracked skylight, the glassy ink rearranged itself into the same line over and over again: The ninth door opens for the one who carries a star made to wound the night. She had heard scraps of the Ninth Door Prophecy in taverns and processions, never in a language that felt personal. Here, in the Archive's dead quiet, it sounded like a summons.

She nearly missed the boy in the lantern-blue coat until he spoke from the shadows above her. Iven Vale leaned over the rail with a messenger satchel across his chest and a look that could not decide whether it wanted to be afraid or impressed. He warned her the Quiet Order had already sealed the river exits. Before Mara could bolt, the eastern lock clicked open on its own and exposed a narrow room lined with black glass reliquaries.

At the center sat the Star-Key: a shard of faceted metal suspended inside a ring of humming wire. When Mara reached for it, the room answered. Light crawled through the walls, old names brightened inside the ledger, and somewhere deeper in the complex a bell rang once, twice, then a third time. Iven swore that the Order only rang the third bell when the city believed a prophecy had started moving again.

Mara took the Star-Key anyway. The reliquaries burst into a spray of mirrored dust, the eastern gallery flooded with white noise, and the whole Archive seemed to turn toward her. By the time she and Iven ran for the outer catwalks, every watch-lantern in the district had woken up. Above the doors, etched into the damp stone where no words had been a moment earlier, a single title burned in silver: Archivist of the Ninth Door.`,
  },
  {
    chapterNumber: 2,
    summary:
      "Mara and Iven flee through the Salt Stair while Sister Cal closes the district around them. Mara uses Resonance Weaving for the first time in years and leaves the chapter wounded, carrying the Star-Key and a harder version of the prophecy.",
    content: `The Salt Stair twisted beneath the city like the spine of a drowned animal. Mara took the upper landings two at a time, one hand pressed to the Star-Key inside her coat and the other dragging herself along the wet stone whenever her boots slipped. Iven kept pace in frightened bursts, reading old route markings aloud and warning her when the Quiet Order lanterns flashed through the cracks above.

By midday they had reached a service chapel cut into the wall of the stairwell. Sister Cal was already waiting there. She stood beside a bowl of cold oil with her gloves folded neatly over one wrist, calm in the way only dangerous people ever looked calm. Mara remembered her from the conservatory courts: First Bell, keeper of discipline, the woman whose voice could make an entire hall kneel without raising its volume.

Cal did not ask for the Star-Key. She asked whether Mara understood what she had awakened. When Mara refused to answer, Cal began reciting the prophecy from memory, but the version she spoke was longer than the one in the ledger. It ended with a line Mara had never heard before: The key chooses a keeper, and the keeper breaks the city before the city can break the door.

The Quiet Order closed the chapel exits while Cal spoke. Iven panicked and reached for the oil lamps hanging from the alcove beams, and Mara realized too late that the old resonance wards still lived in the masonry. She had sworn off Resonance Weaving after the river riots, after the voices in the glass had learned how to echo inside her for days. But there was no room left for careful promises. She threaded sound through the chapel walls and split the lock harmonics wide open.

The blast opened a path, but it ripped the skin across her palm and set every bell in the Salt Stair shrieking. Iven dragged her down the lower landings while the Order regrouped above them. Behind them, Sister Cal did not chase. She simply called after Mara by a new name, one the stair seemed eager to remember: Keeper of Cinders.

When they finally stopped beneath the floodline, Mara could barely close her hand. The Star-Key was hot against her ribs, the prophecy felt less like ink and more like a wound, and Iven admitted the Order had planted him near her weeks ago. He stayed anyway. Mara did not forgive him, but she did not send him away.`,
  },
  {
    chapterNumber: 3,
    summary:
      "Mara reaches the breached northern halls and learns the Ash Market is trading prophecy fragments tied to the Ninth Door. Iven breaks openly with the Quiet Order, Sister Cal loses control of the district, and the Glass Archive shifts from sealed sanctuary to unstable battlefield.",
    content: `By the third night the northern halls of the Glass Archive no longer felt like sacred ground. They felt like siege territory. Water moved through the lower corridors in cold ribbons, broken catalog drawers drifted against the pillars, and every intact mirror had been turned to face the same collapsed archway where the river wall had given up.

Mara crossed the breach with the Star-Key wrapped in gauze, listening to the city talk about her through stolen names. Dockworkers had started calling her Keeper of Cinders after the Salt Stair, and somewhere beyond the broken rail lines the Ash Market was already selling glass slips that claimed to contain fragments of the Ninth Door Prophecy. Half the city thought she was a warning. The other half thought she was an invitation.

Iven made his choice at dawn. He intercepted one of the Quiet Order scouts near the index chambers, took the satchel codes off him, and burned the route sheet in full view of the gallery windows. The gesture was loud on purpose. When Sister Cal's people came looking for proof of his loyalty, there was none left to salvage. He told Mara they would never stop hunting him now, then laughed like that fact made something simpler.

What he stole mattered more than the codes. The Ash Market, according to the scout reports, had acquired a broker who could read keyed relics without opening them. If the Market really had prophecy fragments, then the Star-Key was no longer the only object pulling the city toward the Ninth Door. Mara finally understood why Cal had tightened the district instead of retrieving the key by force: control was already slipping.

By noon the Quiet Order lost the upper bridges. One faction moved to barricade the Lantern Conservatory, another started negotiating with the market smugglers, and the bells that once carried Cal's orders across the district began answering different hands. Mara watched the shift from an observation gantry while floodwater climbed the archive stairs one shallow step at a time.

The Glass Archive had stopped being a vault. It was becoming a fault line. Mara slid the Star-Key into the old keeper's cradle above the broken index and felt the mechanism answer to her alone. For the first time since the prophecy named her, she did not feel chosen. She felt installed. Somewhere below, the city kept chanting Keeper of Cinders, and this time the walls did not sound like they were warning her away.`,
  },
];

export const MEMORY_SHOWCASE_CUSTOM_TYPES: CustomTypeSeed[] = [
  {
    name: "magic_system",
    color: "#14b8a6",
    icon: "sparkles",
    suggestedFields: [
      { key: "cost", placeholder: "What does it consume?" },
      { key: "limit", placeholder: "What constrains it?" },
    ],
  },
  {
    name: "institution",
    color: "#f59e0b",
    icon: "building",
    suggestedFields: [
      { key: "leader", placeholder: "Who currently runs it?" },
      { key: "status", placeholder: "stable, pressured, fractured" },
    ],
  },
  {
    name: "prophecy",
    color: "#8b5cf6",
    icon: "scroll",
    suggestedFields: [
      { key: "status", placeholder: "dormant, active, fulfilled" },
      { key: "subject", placeholder: "Who or what it concerns" },
    ],
  },
];

export const MEMORY_SHOWCASE_ENTRIES: EntrySeed[] = [
  {
    key: "mara_voss",
    name: "Mara Voss",
    entryType: "character",
    description:
      "A former archive runner who becomes the unwilling keeper of the Star-Key after breaking into the Glass Archive.",
    aliases: ["The Archivist"],
    tags: ["protagonist", "smuggler", "chosen keeper"],
    color: "#fb7185",
    sortOrder: 1,
    customFields: fields(
      ["role", "archive runner turned reluctant keeper"],
      ["status", "moving faster than the city can define her"],
      ["goal", "learn what the Ninth Door wants before the city weaponizes it"],
      ["allegiance", "herself, then whoever survives beside her"]
    ),
  },
  {
    key: "iven_vale",
    name: "Iven Vale",
    entryType: "character",
    description:
      "A young courier planted near Mara by the Quiet Order who gradually chooses her side instead of the city's official one.",
    aliases: ["Lantern Boy"],
    tags: ["courier", "double agent"],
    color: "#60a5fa",
    sortOrder: 2,
    customFields: fields(
      ["role", "courier and reluctant informant"],
      ["status", "caught between obedience and conviction"],
      ["allegiance", "Quiet Order, then Mara"]
    ),
  },
  {
    key: "sister_cal",
    name: "Sister Cal",
    entryType: "character",
    description:
      "The First Bell of the Quiet Order, disciplined and patient enough to make obedience feel ceremonial.",
    aliases: ["First Bell"],
    tags: ["antagonist", "order leadership"],
    color: "#f97316",
    sortOrder: 3,
    customFields: fields(
      ["role", "enforcer and strategic face of the Quiet Order"],
      ["status", "calm, controlled, and increasingly cornered"],
      ["allegiance", "the Quiet Order"]
    ),
  },
  {
    key: "glass_archive",
    name: "Glass Archive",
    entryType: "location",
    description:
      "A flooded archive-complex whose sealed galleries store memory-reactive relics and unfinished prophecies.",
    tags: ["archive", "sanctuary", "fault line"],
    color: "#22d3ee",
    sortOrder: 1,
    customFields: fields(
      ["region", "north river district"],
      ["condition", "sealed and watched"],
      ["significance", "the resting place of keyed relics and prophecy records"]
    ),
  },
  {
    key: "salt_stair",
    name: "Salt Stair",
    entryType: "location",
    description:
      "A vertical maintenance corridor beneath the city used by smugglers, keepers, and anyone fleeing the bridges above.",
    tags: ["escape route", "under-city"],
    color: "#38bdf8",
    sortOrder: 2,
    customFields: fields(
      ["region", "under-city transit spine"],
      ["condition", "wet, unstable, and full of resonance wards"]
    ),
  },
  {
    key: "star_key",
    name: "Star-Key",
    entryType: "object",
    description:
      "A keyed relic that answers the Ninth Door prophecy and appears to recognize Mara as its current keeper.",
    tags: ["relic", "prophecy trigger"],
    color: "#facc15",
    sortOrder: 1,
    customFields: fields(
      ["owner", "unclaimed at first touch"],
      ["status", "active"],
      ["significance", "opens or stabilizes whatever the Ninth Door actually is"]
    ),
  },
  {
    key: "quiet_order",
    name: "Quiet Order",
    entryType: "faction",
    description:
      "A disciplined civic-religious order that treats dangerous knowledge as something to contain, rank, and weaponize quietly.",
    tags: ["authority", "religious order"],
    color: "#ef4444",
    sortOrder: 1,
    customFields: fields(
      ["goal", "control the Star-Key and manage prophecy fallout"],
      ["status", "publicly authoritative, privately strained"],
      ["influence", "district bells, bridge guards, archival courts"]
    ),
  },
  {
    key: "echo_fever",
    name: "Echo Fever",
    entryType: "lore",
    description:
      "A resonance sickness that causes voices, memories, and stored impressions in glass to bleed into waking perception.",
    tags: ["curse", "magic cost"],
    color: "#a78bfa",
    sortOrder: 1,
    customFields: fields(
      ["symptom", "auditory memory bleed and unstable recall"],
      ["risk", "makes resonance work more powerful and less controllable"]
    ),
  },
  {
    key: "ninth_door_night",
    name: "Night of the Ninth Door",
    entryType: "event",
    description:
      "The long-remembered disaster that first turned the Ninth Door prophecy into civic doctrine.",
    tags: ["historical catastrophe"],
    color: "#34d399",
    sortOrder: 1,
    customFields: fields(
      ["status", "historical but newly relevant"],
      ["impact", "reshaped how the city treats sealed relics and prophecy"]
    ),
  },
  {
    key: "resonance_weaving",
    name: "Resonance Weaving",
    entryType: "magic_system",
    description:
      "A form of sound-and-memory shaping that manipulates wards, lock harmonics, and reactive glass.",
    tags: ["magic", "dangerous skill"],
    color: "#14b8a6",
    sortOrder: 1,
    customFields: fields(
      ["cost", "bleeding hands, memory distortion, echo exposure"],
      ["limit", "requires tuned structures and punishes imprecision"]
    ),
  },
  {
    key: "lantern_conservatory",
    name: "Lantern Conservatory",
    entryType: "institution",
    description:
      "An elite training house that produces archivists, resonance handlers, and ceremonial readers for the upper districts.",
    tags: ["school", "elite institution"],
    color: "#f59e0b",
    sortOrder: 1,
    customFields: fields(
      ["leader", "a rotating tribunal under Quiet Order pressure"],
      ["status", "stable but politically exposed"]
    ),
  },
  {
    key: "ninth_door_prophecy",
    name: "Ninth Door Prophecy",
    entryType: "prophecy",
    description:
      "A city-defining prophecy about a star-wrought key, a named keeper, and a door capable of remaking civic order.",
    tags: ["prophecy", "city myth"],
    color: "#8b5cf6",
    sortOrder: 1,
    customFields: fields(
      ["status", "dormant until the Star-Key is claimed"],
      ["subject", "the keeper, the key, and the city that fears both"]
    ),
  },
];

export const MEMORY_SHOWCASE_RELATIONSHIPS: RelationshipSeed[] = [
  {
    sourceKey: "mara_voss",
    targetKey: "iven_vale",
    forwardLabel: "protects",
    reverseLabel: "protected by",
  },
  {
    sourceKey: "mara_voss",
    targetKey: "sister_cal",
    forwardLabel: "defies",
    reverseLabel: "opposed by",
  },
  {
    sourceKey: "sister_cal",
    targetKey: "quiet_order",
    forwardLabel: "leads",
    reverseLabel: "led by",
  },
  {
    sourceKey: "mara_voss",
    targetKey: "star_key",
    forwardLabel: "carries",
    reverseLabel: "carried by",
  },
  {
    sourceKey: "star_key",
    targetKey: "glass_archive",
    forwardLabel: "was hidden in",
    reverseLabel: "contained",
  },
  {
    sourceKey: "quiet_order",
    targetKey: "lantern_conservatory",
    forwardLabel: "pressures",
    reverseLabel: "pressured by",
  },
  {
    sourceKey: "ninth_door_prophecy",
    targetKey: "mara_voss",
    forwardLabel: "names",
    reverseLabel: "named by",
  },
  {
    sourceKey: "resonance_weaving",
    targetKey: "mara_voss",
    forwardLabel: "used by",
    reverseLabel: "uses",
  },
];

export const MEMORY_SHOWCASE_PROGRESSIONS: ProgressionSeed[] = [
  {
    entryKey: "mara_voss",
    chapterNumber: 2,
    fieldOverrides: {
      status: "wounded but still driving the escape",
      goal: "decode the prophecy before the Quiet Order corners her",
    },
    notes:
      "The Salt Stair escape leaves Mara physically injured and more openly tied to the prophecy.",
  },
  {
    entryKey: "mara_voss",
    chapterNumber: 3,
    fieldOverrides: {
      status: "keeper of the Star-Key and a public symbol the city is naming in real time",
      allegiance: "herself, Iven, and the truth behind the Ninth Door",
    },
    descriptionOverride:
      "Mara has shifted from thief to active keeper, and the city is beginning to organize itself around that fact.",
  },
  {
    entryKey: "iven_vale",
    chapterNumber: 2,
    fieldOverrides: {
      allegiance: "Quiet Order asset with growing doubts",
    },
    notes: "He admits the Order placed him near Mara before the Archive break-in.",
  },
  {
    entryKey: "iven_vale",
    chapterNumber: 3,
    fieldOverrides: {
      allegiance: "Mara's ally and an open defector from the Quiet Order",
      status: "burned his route codes and made the break public",
    },
  },
  {
    entryKey: "glass_archive",
    chapterNumber: 3,
    fieldOverrides: {
      condition: "breached, partially flooded, and no longer defensible as a sealed sanctuary",
    },
    descriptionOverride:
      "The Archive has shifted from protected vault to active fault line in the city's struggle over the Ninth Door.",
  },
  {
    entryKey: "star_key",
    chapterNumber: 3,
    fieldOverrides: {
      owner: "Mara Voss",
    },
  },
  {
    entryKey: "ninth_door_prophecy",
    chapterNumber: 3,
    fieldOverrides: {
      status: "active and spreading through rumor, trade, and civic panic",
    },
  },
];

export const MEMORY_SHOWCASE_SUGGESTIONS: SuggestionSeed[] = [
  {
    chapterNumber: 3,
    changeType: "create_entry",
    payload: {
      name: "Ash Market",
      entryType: "location",
      description:
        "A black-market exchange dealing in keyed relic fragments, rumor-trade, and prophecy slips pulled from the river districts.",
      tags: ["market", "black market", "prophecy trade"],
      aliases: [],
      customFields: fields(
        ["region", "outer dock district"],
        ["status", "expanding fast as prophecy trade spikes"]
      ),
    },
    evidenceText:
      "the Ash Market was already selling glass slips that claimed to contain fragments of the Ninth Door Prophecy",
    rationale:
      "Chapter 3 introduces the Ash Market as a concrete new place with story relevance.",
    confidence: "high",
    status: "pending",
  },
  {
    chapterNumber: 3,
    targetEntryKey: "mara_voss",
    changeType: "update_entry_aliases",
    payload: {
      entryId: "",
      entryName: "Mara Voss",
      aliases: ["Keeper of Cinders"],
    },
    evidenceText:
      "Dockworkers had started calling her Keeper of Cinders after the Salt Stair",
    rationale:
      "The alias is now being used by the wider city, not just Sister Cal.",
    confidence: "high",
    status: "pending",
  },
  {
    chapterNumber: 3,
    targetEntryKey: "iven_vale",
    changeType: "create_relationship",
    payload: {
      sourceEntryName: "Iven Vale",
      sourceEntryId: "",
      targetEntryName: "Quiet Order",
      targetEntryId: "",
      forwardLabel: "defects from",
      reverseLabel: "loses",
    },
    evidenceText:
      "He intercepted one of the Quiet Order scouts ... and burned the route sheet in full view of the gallery windows.",
    rationale:
      "Chapter 3 turns Iven's internal conflict into an explicit public break with the Quiet Order.",
    confidence: "high",
    status: "pending",
  },
  {
    chapterNumber: 3,
    targetEntryKey: "quiet_order",
    changeType: "create_progression",
    payload: {
      entryId: "",
      entryName: "Quiet Order",
      chapterNumber: 3,
      fieldOverrides: {
        status: "publicly compromised and beginning to fracture by faction",
      },
      notes:
        "Their district control is breaking as different groups choose barricades, markets, or private deals.",
    },
    evidenceText:
      "The Quiet Order lost the upper bridges. One faction moved to barricade the Lantern Conservatory, another started negotiating with the market smugglers",
    rationale:
      "This is a meaningful chapter-aware state change for the faction.",
    confidence: "high",
    status: "pending",
  },
  {
    chapterNumber: 3,
    targetEntryKey: "glass_archive",
    changeType: "flag_stale_entry",
    payload: {
      entryId: "",
      entryName: "Glass Archive",
      reason:
        "The base entry still reads like a sealed vault, but Chapter 3 makes it clear the Archive is now breached and operating as an active conflict zone.",
      suspectedFields: ["condition", "description"],
    },
    evidenceText:
      "The Glass Archive had stopped being a vault. It was becoming a fault line.",
    rationale:
      "The story's current truth now exceeds the original entry framing.",
    confidence: "medium",
    status: "pending",
  },
  {
    chapterNumber: 2,
    targetEntryKey: "sister_cal",
    changeType: "update_entry_aliases",
    payload: {
      entryId: "",
      entryName: "Sister Cal",
      aliases: ["First Bell"],
    },
    evidenceText: "She stood beside a bowl of cold oil ... First Bell",
    rationale: "This title is explicit and stable enough to keep.",
    confidence: "high",
    status: "applied",
    reviewedAt: "2026-03-27T09:05:00.000Z",
    appliedAt: "2026-03-27T09:05:00.000Z",
  },
  {
    chapterNumber: 2,
    changeType: "create_entry",
    payload: {
      name: "Copper Reeve",
      entryType: "character",
      description:
        "A rumored bridge official mentioned in passing with no meaningful role in the plot yet.",
      tags: ["minor mention"],
      aliases: [],
      customFields: [],
    },
    evidenceText: "a copper reeve was already closing the upper bridges",
    rationale: "The mention is too thin to justify a durable entry.",
    confidence: "low",
    status: "rejected",
    reviewedAt: "2026-03-27T09:10:00.000Z",
  },
];

export function buildShowcaseStory(
  storyRow: ShowcaseStoryRow,
  chapterRows: ShowcaseChapterRow[]
): Story {
  return {
    id: storyRow.id,
    title: storyRow.title,
    projectMode: "fiction",
    modeConfig: {},
    chapters: chapterRows
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map((chapter) => ({
        id: chapter.id,
        chapterNumber: chapter.chapter_number,
        content: chapter.content,
        summary: chapter.summary ?? undefined,
        wordCount: chapter.word_count,
      })),
    fandom: storyRow.fandom,
    customFandom: storyRow.custom_fandom ?? undefined,
    characters: storyRow.characters,
    relationshipType: storyRow.relationship_type,
    rating: storyRow.rating,
    setting: storyRow.setting ?? undefined,
    tone: storyRow.tone,
    tropes: storyRow.tropes,
    createdAt: storyRow.created_at,
    updatedAt: storyRow.updated_at,
    wordCount: storyRow.word_count,
  };
}

export function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export type ShowcaseStoryRow = {
  id: string;
  title: string;
  project_mode?: "fiction";
  mode_config?: Record<string, never>;
  fandom: string;
  custom_fandom: string | null;
  characters: string[];
  relationship_type: Story["relationshipType"];
  rating: Story["rating"];
  setting: string | null;
  tone: string[];
  tropes: string[];
  word_count: number;
  created_at: string;
  updated_at: string;
};

export type ShowcaseChapterRow = {
  id: string;
  story_id: string;
  chapter_number: number;
  content: string;
  summary: string | null;
  word_count: number;
};

function fields(...pairs: Array<[string, string]>): MemoryCustomField[] {
  return pairs.map(([key, value]) => ({ key, value }));
}
