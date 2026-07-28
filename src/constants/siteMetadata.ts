export const SITE_NAME = "FilterMyDiscogs";
export const DEFAULT_SITE_URL = "https://filtermydisco.gs";

export const SITE_TAGLINE = "Digging made easier.";
export const SITE_DESCRIPTION =
  "Browse and filter your Discogs collection, build crates, explore insights, and share cover-art mosaics.";

export const SITE_DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const sitePageTitle = (page: string): string => `${page} | ${SITE_NAME}`;

export const getMetadataSiteUrl = (): string =>
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

export const PAGE_DESCRIPTIONS = {
  releases:
    "Search, filter, and sort your Discogs collection. Open releases for tracklists and in-app playback, and add albums to crates as you browse.",
  dashboard:
    "Explore collection insights — milestones, style evolution, growth trends, and more.",
  mosaic:
    "Create cover-art mosaic grids from your collection or crates for social sharing.",
  settings:
    "Manage theme, sync preferences, and stored data for your FilterMyDiscogs account.",
  about:
    "Learn about FilterMyDiscogs, get in touch, and find ways to support the project.",
  legal: "Terms of Service and Privacy Policy for FilterMyDiscogs.",
  admin: "Admin statistics and analytics dashboard.",
  crateFallback: "A shared crate on FilterMyDiscogs.",
} as const;
