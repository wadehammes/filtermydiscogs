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
      "See milestones, style evolution, and growth trends with charts and stats. Spot patterns in your buying habits and follow the story your records tell over time.",
    imageBase: "dashboard",
    imageAlt:
      "Collections insights dashboard with stats, charts, and collection milestones",
  },
  {
    eyebrow: "Browse",
    title: "Browse, search, and filter",
    description:
      "Rediscover albums across your library. Search by title, artist, or label, switch between grid and table views, and open any release for its tracklist. Preview tracks with the in-app player and add or edit collection notes that stay synced with Discogs.",
    imageBase: "releases",
    imageAlt:
      "Releases page with search, filters, tracklist, in-app player, and release cards",
  },
  {
    eyebrow: "Crates",
    title: "Organize and share crates",
    description:
      "Build crates for DJ gigs, themed lists, or long-term favorites. Reorder your set, add section markers, write set notes, and track gig-packing progress on the crate page. Make a crate public when you want someone else to explore your picks.",
    imageBase: "crates",
    imageAlt:
      "Crate detail page with section markers, set notes, gig-packing checklist, and an organized release list",
  },
  {
    eyebrow: "Mosaics",
    title: "Generate cover-art mosaics",
    description:
      "Turn your collection or a crate into a cover-art grid for social sharing. Pick formats and sizes for Instagram, headers, or print. A quick visual snapshot of what you are spinning.",
    imageBase: "mosaic",
    imageAlt:
      "Cover-art mosaic grid generated from a collection of release artwork",
    themeIndependent: true,
  },
];
