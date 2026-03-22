import { FandomConfig, FandomCategory } from "../types/fandom";

const FANDOMS: Record<string, FandomConfig> = {
  "harry-potter": {
    id: "harry-potter",
    name: "Harry Potter",
    category: "books",
    canonRules:
      "Follow Harry Potter canon. Use magical elements, proper spell incantations, Hogwarts houses and their traits. No modern technology like phones or internet. Magic follows established rules. Use British English.",
    locations:
      "Hogwarts, Diagon Alley, Hogsmeade, The Burrow, Grimmauld Place, Ministry of Magic, Forbidden Forest, Room of Requirement",
    era: "Can be set during any era (Founders, Marauders, Golden Trio, Next Gen)",
  },
  "lord-of-the-rings": {
    id: "lord-of-the-rings",
    name: "Lord of the Rings",
    category: "books",
    canonRules:
      "Follow Tolkien's Middle-earth lore. Respect races (Elves, Dwarves, Hobbits, Men), languages, and the mythology. Magic is subtle and divine, not flashy. Maintain the epic, literary tone.",
    locations:
      "The Shire, Rivendell, Moria, Lothlórien, Rohan, Gondor, Mordor, Mirkwood",
  },
  "percy-jackson": {
    id: "percy-jackson",
    name: "Percy Jackson",
    category: "books",
    canonRules:
      "Follow Rick Riordan's Greek mythology rules. Demigods have one divine parent. Camp Half-Blood and Camp Jupiter are distinct. Use the established power system. Maintain the humorous first-person tone.",
    locations:
      "Camp Half-Blood, Mount Olympus, The Underworld, Camp Jupiter, New Rome",
  },
  "hunger-games": {
    id: "hunger-games",
    name: "The Hunger Games",
    category: "books",
    canonRules:
      "Follow Panem's dystopian setting. 12 districts plus the Capitol. Respect the political system, the Games mechanics, and the rebellion arc. Maintain the tense, survival-focused tone.",
    locations:
      "District 12, The Capitol, The Arena, District 13, The Seam, Victor's Village",
  },
  "acotar": {
    id: "acotar",
    name: "A Court of Thorns and Roses",
    category: "books",
    canonRules:
      "Follow Sarah J. Maas's faerie world rules. Respect the Courts (Night, Spring, Dawn, etc.), mating bonds, Illyrian culture, and High Lord powers. Romantic and dramatic tone. Mature themes are core to this fandom.",
    locations:
      "Velaris, The Night Court, Spring Court, Hewn City, The Illyrian Steppes, Under the Mountain",
  },
  "stranger-things": {
    id: "stranger-things",
    name: "Stranger Things",
    category: "films",
    canonRules:
      "Set in 1980s Hawkins, Indiana. Respect the Upside Down mythology, Eleven's powers, and the group dynamics. Use 80s cultural references. Maintain the blend of horror, sci-fi, and coming-of-age.",
    locations:
      "Hawkins, The Upside Down, Hawkins Lab, Starcourt Mall, The Wheeler House",
  },
  marvel: {
    id: "marvel",
    name: "Marvel (MCU)",
    category: "films",
    canonRules:
      "Follow MCU canon (not comics unless specified). Respect character power levels, relationships, and timeline events. Can be set pre or post-Endgame. Maintain the blend of action and character drama.",
    locations:
      "Avengers Tower, Wakanda, Asgard, Sanctum Sanctorum, S.H.I.E.L.D. facilities",
  },
  "star-wars": {
    id: "star-wars",
    name: "Star Wars",
    category: "films",
    canonRules:
      "Follow Star Wars universe rules. Respect the Force (Light/Dark), Jedi/Sith dynamics, galactic politics. Can be set in any era (Old Republic, Clone Wars, Empire, Sequel). Maintain space opera tone.",
    locations:
      "Coruscant, Tatooine, Naboo, Death Star, Mandalore, Dagobah, Ahch-To",
  },
  "game-of-thrones": {
    id: "game-of-thrones",
    name: "Game of Thrones",
    category: "films",
    canonRules:
      "Follow Westeros lore and political dynamics. Respect house allegiances, the Wall, dragons, and the complex morality of the world. Mature themes (violence, politics, romance) are central. No character is safe.",
    locations:
      "King's Landing, Winterfell, The Wall, Dragonstone, Braavos, The Red Keep, Castle Black",
  },
  naruto: {
    id: "naruto",
    name: "Naruto",
    category: "anime",
    canonRules:
      "Use chakra-based abilities and established jutsu. Respect ninja ranks (Genin, Chunin, Jonin, Kage). Follow jutsu naming conventions. Use Japanese honorifics correctly. Maintain the themes of bonds and perseverance.",
    locations:
      "Konohagakure, The Forest of Death, Ichiraku Ramen, Hokage Tower, Valley of the End, Akatsuki hideouts",
  },
  "my-hero-academia": {
    id: "my-hero-academia",
    name: "My Hero Academia",
    category: "anime",
    canonRules:
      "Respect the Quirk system and its rules. Follow UA High Academy structure. Maintain hero ranking system. Use established character abilities correctly. Blend school life with hero action.",
    locations:
      "UA High Academy, Ground Beta, Heights Alliance dorms, Hero agencies, Tartarus prison",
  },
  "attack-on-titan": {
    id: "attack-on-titan",
    name: "Attack on Titan",
    category: "anime",
    canonRules:
      "Respect the Titan mythology and its reveals. Follow the military structure (Survey Corps, Garrison, Military Police). Use ODM gear correctly. Maintain the dark, suspenseful tone. Massive spoiler-sensitive world.",
    locations:
      "Paradis Island, Wall Maria/Rose/Sina, Shiganshina, Marley, Liberio",
  },
  "demon-slayer": {
    id: "demon-slayer",
    name: "Demon Slayer",
    category: "anime",
    canonRules:
      "Follow Breathing Styles and their forms. Respect the Demon Slayer Corps hierarchy (Hashira system). Use Blood Demon Arts for demons. Maintain the Taisho-era Japanese setting. Blend action with emotional storytelling.",
    locations:
      "Demon Slayer Corps HQ, Mt. Natagumo, Mugen Train, Entertainment District, Swordsmith Village",
  },
  "dragon-age": {
    id: "dragon-age",
    name: "Dragon Age",
    category: "games",
    canonRules:
      "Respect Thedas lore. Mages face oppression from Templars. Blood magic is forbidden but tempting. Magic comes from the Fade. Use appropriate terminology (Chantry, Blight, Darkspawn, Veil). Romance is a major part of this franchise.",
    locations:
      "Ferelden, Kirkwall, Orlais, Skyhold, The Fade, Tevinter Imperium, Deep Roads",
  },
  "mass-effect": {
    id: "mass-effect",
    name: "Mass Effect",
    category: "games",
    canonRules:
      "Follow Mass Effect universe rules. Respect alien species (Turian, Asari, Krogan, Quarian, etc.) and their cultures. Use biotics, omni-tools, and Mass Relay technology correctly. The Normandy is home.",
    locations:
      "The Normandy, Citadel, Omega, Thessia, Tuchanka, Rannoch, Illium",
  },
  "baldurs-gate": {
    id: "baldurs-gate",
    name: "Baldur's Gate 3",
    category: "games",
    canonRules:
      "Follow D&D 5e / Forgotten Realms lore. Respect the tadpole/Illithid storyline. Use established companion personalities (Astarion, Shadowheart, Gale, Lae'zel, Karlach, Wyll). Mature romance is central to this fandom.",
    locations:
      "The Nautiloid, Emerald Grove, Goblin Camp, Moonrise Towers, Baldur's Gate city, The Underdark, Shadow-Cursed Lands",
  },
};

export const FANDOM_CATEGORIES: FandomCategory[] = [
  {
    id: "books",
    label: "Books",
    emoji: "📚",
    fandoms: Object.values(FANDOMS).filter((f) => f.category === "books"),
  },
  {
    id: "films",
    label: "Films & TV",
    emoji: "🎬",
    fandoms: Object.values(FANDOMS).filter((f) => f.category === "films"),
  },
  {
    id: "anime",
    label: "Anime",
    emoji: "📺",
    fandoms: Object.values(FANDOMS).filter((f) => f.category === "anime"),
  },
  {
    id: "games",
    label: "Games",
    emoji: "🎮",
    fandoms: Object.values(FANDOMS).filter((f) => f.category === "games"),
  },
];

export function getFandomById(id: string): FandomConfig | undefined {
  return FANDOMS[id];
}

export function getFandomContext(fandomId: string): string {
  const fandom = FANDOMS[fandomId];
  if (!fandom) return "";
  return `UNIVERSE: ${fandom.name}
CANON RULES: ${fandom.canonRules}
KEY LOCATIONS: ${fandom.locations}
${fandom.era ? `ERA: ${fandom.era}` : ""}`;
}

export const TROPES = [
  "Enemies to Lovers",
  "Slow Burn",
  "Forbidden Love",
  "Redemption Arc",
  "Found Family",
  "Second Chance",
  "Love Triangle",
  "Chosen One",
  "Friends to Lovers",
  "Hurt/Comfort",
  "Fake Dating",
  "Only One Bed",
  "Dark Romance",
  "Obsessive Love",
  "Power Imbalance",
  "Morally Grey Hero",
] as const;
