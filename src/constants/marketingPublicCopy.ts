export const MARKETING_FILTER_BULLET = {
  label: "Find hidden gems in your collection",
  text: "Require-all and exclude on genres, formats, and years; dropdowns follow your grid. Search and save views.",
} as const;

export const MARKETING_COLLECTION_INSIGHTS_BULLET = {
  label: "Collection insights dashboard",
  text: "Milestones, style evolution, growth charts, most-crated releases, weekly recap, and on-repeat play and listen leaders.",
} as const;

export const MARKETING_PLAYLIST_BULLET = {
  label: "Build and share playlists",
  text: "Save cross-release track lists, reorder and play in-app, and share a link listeners can play without signing in.",
} as const;

export const MARKETING_CRATE_ORGANIZE_BULLET_GENERIC = {
  label: "Organize and share crates",
  text: "Stage picks from Releases, reorder with drag, add sections and set notes, track gig packing, and share a public crate link.",
} as const;

export const MARKETING_CRATE_ORGANIZE_BULLET = {
  ...MARKETING_CRATE_ORGANIZE_BULLET_GENERIC,
  text: `${MARKETING_CRATE_ORGANIZE_BULLET_GENERIC.text.replace(/\.$/, "")} like this one.`,
} as const;

export const MARKETING_PLAYLIST_BULLET_PUBLIC_PAGE = {
  ...MARKETING_PLAYLIST_BULLET,
  text: `${MARKETING_PLAYLIST_BULLET.text.replace(/\.$/, "")} like this one.`,
} as const;

export const MARKETING_MOSAIC_BULLET = {
  label: "Cover-art mosaics",
  text: "Build cover-art grids from your collection, a crate, or playlist art for social posts or print.",
} as const;

export const PUBLIC_CRATE_MARKETING_BULLETS = [
  MARKETING_FILTER_BULLET,
  MARKETING_COLLECTION_INSIGHTS_BULLET,
  MARKETING_PLAYLIST_BULLET,
  MARKETING_CRATE_ORGANIZE_BULLET,
  MARKETING_MOSAIC_BULLET,
] as const;

export const PUBLIC_PLAYLIST_MARKETING_BULLETS = [
  MARKETING_FILTER_BULLET,
  MARKETING_COLLECTION_INSIGHTS_BULLET,
  MARKETING_PLAYLIST_BULLET_PUBLIC_PAGE,
  MARKETING_CRATE_ORGANIZE_BULLET_GENERIC,
  MARKETING_MOSAIC_BULLET,
] as const;
