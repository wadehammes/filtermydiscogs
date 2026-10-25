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
    eyebrow: "Insights",
    title: "Collection insights dashboard",
    description:
      "See milestones, style evolution, and growth trends with charts and stats. On repeat highlights the tracks you play and listen to most. Spot patterns in your buying habits and follow the story your records tell over time.",
    imageBase: "dashboard",
    imageAlt:
      "Collections insights dashboard with stats, charts, on-repeat track leaders, and collection milestones",
  },
  {
    eyebrow: "Browse",
    title: "Browse, search, and filter",
    description:
      "Rediscover albums across your library. Search by title, artist, or label, switch between grid and table views, and open any release for its tracklist. Preview tracks with the in-app player, add tracks to playlists or the queue, see listen counts on each tracklist, and add or edit collection notes that stay synced with Discogs.",
    imageBase: "releases",
    imageAlt:
      "Releases page with search, filters, tracklist, in-app player, and release cards",
  },
  {
    eyebrow: "Playlists",
    title: "Build and share playlists",
    description:
      "Save cross-release track lists from your collection. Reorder tracks, play through the in-app queue, and share a public playlist link when you want someone else to listen along.",
    imageBase: "releases",
    imageAlt:
      "Public playlist page with cover art, track list, and in-app playback",
  },
  {
    eyebrow: "Crates",
    title: "Organize and share crates",
    description:
      "Build crates for DJ gigs, themed album lists, or favorites. Drag to reorder releases, split the list with sections, add set notes, and track gig packing on the crate page. Share a public crate link when you want someone else to browse your picks.",
    imageBase: "crates",
    imageAlt:
      "Crate page with drag reorder, section groups, set notes, and gig packing checklist",
  },
  {
    eyebrow: "Mosaics",
    title: "Generate cover-art mosaics",
    description:
      "Turn your collection, a crate, or playlist art into a cover-art grid for social sharing. Pick formats and sizes for Instagram, headers, or print. A quick visual snapshot of what you are spinning.",
    imageBase: "mosaic",
    imageAlt:
      "Cover-art mosaic grid generated from a collection of release artwork",
    themeIndependent: true,
  },
];
