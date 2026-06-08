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
    title: "Collections Insights Dashboard",
    description:
      "Discover collection milestones, style evolution over time, and growth trends with clear charts and stats. See how your taste has changed, spot patterns in your buying habits, and celebrate the story your records tell.",
    imageBase: "dashboard",
    imageAlt:
      "Collections insights dashboard with stats, charts, and collection milestones",
  },
  {
    eyebrow: "Browse",
    title: "Browse, search, and filter your collection",
    description:
      "Rediscover albums and artists across your entire library. Search by title, artist, or label, apply filters as you go, and switch between grid and table views. Add or edit notes on any release from the card or list — kept in sync with your Discogs collection.",
    imageBase: "releases",
    imageAlt:
      "Releases page with search, filters, grid and table views, and release cards",
  },
  {
    eyebrow: "Crates",
    title: "Create and manage crates",
    description:
      "Build crates for DJ gigs, themed lists, or long-term favorites. Add releases while you browse, keep multiple crates in sync, and share public crates when you want someone else to explore your picks.",
    imageBase: "crates",
    imageAlt:
      "Crate drawer showing saved crates and releases organized into a custom list",
  },
  {
    eyebrow: "Mosaics",
    title: "Generate mosaic grids",
    description:
      "Turn your collection or a crate into a cover-art mosaic for social sharing. Choose formats and sizes that fit Instagram, headers, or print — a quick visual snapshot of what you are listening to.",
    imageBase: "mosaic",
    imageAlt:
      "Cover-art mosaic grid generated from a collection of release artwork",
    themeIndependent: true,
  },
];
