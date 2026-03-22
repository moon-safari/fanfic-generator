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
