export interface FandomConfig {
  id: string;
  name: string;
  category: "books" | "films" | "anime" | "games";
  canonRules: string;
  locations: string;
  era?: string;
}

export interface FandomCategory {
  id: string;
  label: string;
  emoji: string;
  fandoms: FandomConfig[];
}
