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
