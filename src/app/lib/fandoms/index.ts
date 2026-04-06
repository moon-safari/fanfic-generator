import type { FandomConfig, FandomCategory } from "../../types/fandom.ts";
import { BOOK_FANDOMS } from "./books.ts";
import { FILM_TV_FANDOMS } from "./films-tv.ts";
import { ANIME_FANDOMS } from "./anime.ts";
import { GAME_FANDOMS } from "./games.ts";
import { CARTOON_FANDOMS } from "./cartoons.ts";
import { WEB_OTHER_FANDOMS } from "./web-other.ts";
import { KPOP_FANDOMS } from "./kpop.ts";
import { ASIAN_MEDIA_FANDOMS } from "./asian-media.ts";

export { TROPE_CATEGORIES, ALL_TROPES } from "./tropes.ts";
export { TONES } from "./tones.ts";


const ALL_FANDOMS: FandomConfig[] = [
  ...BOOK_FANDOMS,
  ...FILM_TV_FANDOMS,
  ...ANIME_FANDOMS,
  ...GAME_FANDOMS,
  ...CARTOON_FANDOMS,
  ...WEB_OTHER_FANDOMS,
  ...KPOP_FANDOMS,
  ...ASIAN_MEDIA_FANDOMS,
];

const FANDOM_MAP = new Map(ALL_FANDOMS.map((f) => [f.id, f]));

export const FANDOM_CATEGORIES: FandomCategory[] = [
  { id: "books", label: "Books", emoji: "\u{1F4DA}", fandoms: BOOK_FANDOMS },
  { id: "films-tv", label: "Films & TV", emoji: "\u{1F3AC}", fandoms: FILM_TV_FANDOMS },
  { id: "anime", label: "Anime & Manga", emoji: "\u{1F4FA}", fandoms: ANIME_FANDOMS },
  { id: "games", label: "Games", emoji: "\u{1F3AE}", fandoms: GAME_FANDOMS },
  { id: "cartoons", label: "Cartoons & Animation", emoji: "\u{1F3A8}", fandoms: CARTOON_FANDOMS },
  { id: "web-other", label: "Web Series & Other", emoji: "\u{1F310}", fandoms: WEB_OTHER_FANDOMS },
  { id: "kpop", label: "K-pop RPF", emoji: "\u{1F3A4}", fandoms: KPOP_FANDOMS },
  { id: "asian-media", label: "Asian Media", emoji: "\u{1F30F}", fandoms: ASIAN_MEDIA_FANDOMS },
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
