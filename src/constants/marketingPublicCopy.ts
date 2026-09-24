export const MARKETING_COLLECTION_INSIGHTS_BULLET = {
  label: "Collection insights dashboard",
  text: "Milestones, style evolution, growth charts, and on-repeat play and listen leaders.",
} as const;

export const MARKETING_BROWSE_COLLECTION_BULLET = {
  label: "Browse, search, and filter",
  text: "Search releases, switch grid or table views, preview tracks in-app, and sync collection notes with Discogs.",
} as const;

export const MARKETING_CRATE_ORGANIZE_BULLET = {
  label: "Organize and share crates",
  text: "Reorder with drag, add sections and set notes, track gig packing, and share a public link like this one.",
} as const;

export const MARKETING_MOSAIC_BULLET = {
  label: "Generate cover-art mosaics",
  text: "Build cover-art grids from your collection or a crate for social posts or print.",
} as const;

export const PUBLIC_CRATE_MARKETING_BULLETS = [
  MARKETING_COLLECTION_INSIGHTS_BULLET,
  MARKETING_BROWSE_COLLECTION_BULLET,
  MARKETING_CRATE_ORGANIZE_BULLET,
  MARKETING_MOSAIC_BULLET,
] as const;
