export type LoginFeature = {
  eyebrow: string;
  title: string;
  description: string;
  imageBase?: string;
  imageAlt?: string;
  themeIndependent?: boolean;
};

export const LOGIN_FEATURES: LoginFeature[] = [
  {
    eyebrow: "Filter",
    title: "Find hidden gems in your collection",
    description:
      "Combine filters on genres, styles, formats, and years to narrow your collection. Search, saved views, random shuffle, in-app preview, queues, playlists, and notes synced with Discogs.",
    imageBase: "releases",
    imageAlt:
      "Releases page with search, flexible filters, random view, tracklist, in-app player, and release cards",
  },
  {
    eyebrow: "Insights",
    title: "Collection insights dashboard",
    description:
      "Milestones, style evolution, and growth charts, plus on-this-day adds and a weekly recap. See which releases land in the most crates, and which tracks you play and listen to most.",
    imageBase: "dashboard",
    imageAlt:
      "Collection insights dashboard with stats, charts, on-repeat leaders, and milestones",
  },
  {
    eyebrow: "Playlists",
    title: "Build and share playlists",
    description:
      "Save cross-release track lists from your collection. Reorder tracks, play through the in-app queue, and share a public link. Listeners can hit play without signing in.",
    imageBase: "playlist",
    imageAlt:
      "Public playlist page with a cover collage, Play All, and a numbered track list",
  },
  {
    eyebrow: "Crates",
    title: "Organize and share crates",
    description:
      "Build crates for DJ gigs, themed lists, or favorites. Stage albums from Releases as you browse, then reorder, add sections, set notes, and check off gig packing. Share a public crate link when you want someone else to browse your picks.",
    imageBase: "crates",
    imageAlt:
      "Crate page with drag reorder, section groups, set notes, and gig packing checklist",
  },
  {
    eyebrow: "Mosaics",
    title: "Cover-art mosaics",
    description:
      "Turn your collection, a crate, or playlist into a cover grid for social or print. Pick a size and export JPEG or PNG. A fast snapshot of what you are spinning.",
    imageBase: "mosaic",
    imageAlt:
      "Cover-art mosaic grid generated from a collection of release artwork",
    themeIndependent: true,
  },
];
