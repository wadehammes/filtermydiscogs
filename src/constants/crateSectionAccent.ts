export const CRATE_SECTION_MAX_DEPTH = 2;

export const CRATE_SECTION_ACCENT_KEYS = [
  "slate",
  "rose",
  "amber",
  "teal",
  "plum",
  "forest",
] as const;

export type CrateSectionAccentKey = (typeof CRATE_SECTION_ACCENT_KEYS)[number];
