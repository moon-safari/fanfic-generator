export const PRODUCT_NAME = "Writing Studio";
export const PRODUCT_SHORT_NAME = "Writing OS";
export const PRODUCT_ONE_LINER = "The operating system for writers";
export const PRODUCT_TAGLINE =
  "Write, remember, adapt, and review from one connected workspace.";
export const PRODUCT_HERO_EYEBROW = "The OS for Writing";
export const PRODUCT_DESCRIPTION =
  "An AI writing platform with living project memory. Fiction, newsletters, screenplays, game writing, articles, comics, and more — all from one workspace that remembers your project.";

export const LANDING_PILLARS = [
  {
    title: "Write",
    description:
      "Draft, rewrite, expand, describe, and brainstorm from one active manuscript.",
  },
  {
    title: "Remember",
    description:
      "Keep a living Memory of characters, lore, relationships, aliases, and project truth.",
  },
  {
    title: "Adapt",
    description:
      "Turn one chapter into summaries, recaps, teasers, beat sheets, and future output chains.",
  },
  {
    title: "Review",
    description:
      "Inspect context, accept structured updates, and keep continuity aligned as the project grows.",
  },
] as const;

export const LANDING_MODES = [
  "Fiction",
  "Newsletters",
  "Screenplays",
  "Game Writing",
  "Comics",
  "Non-fiction",
  "Fanfic",
  "Articles",
] as const;

export const LANDING_WORKFLOWS = [
  {
    title: "Draft -> Update -> Continue",
    description:
      "Write a chapter, review Memory changes, then continue with chapter-aware story truth.",
  },
  {
    title: "Chapter -> Recap -> Teaser",
    description:
      "Use one saved chapter as the source for newsletter recaps, public teasers, and future promo chains.",
  },
  {
    title: "Context -> Craft -> Revise",
    description:
      "See what the system is using, pin or exclude project truth, then revise with confidence.",
  },
] as const;
