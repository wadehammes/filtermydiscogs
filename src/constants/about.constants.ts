import { SITE_GITHUB_URL } from "src/constants/siteMetadata";

export const ABOUT_SUPPORT_EMAIL = "noise@filtermydisco.gs";

export const ABOUT_GITHUB_LINKS = {
  repo: SITE_GITHUB_URL,
  discussions: `${SITE_GITHUB_URL}/discussions`,
  issues: `${SITE_GITHUB_URL}/issues`,
} as const;

export const ABOUT_DATA_DELETION_ITEMS = [
  "All auth tokens and session cookies",
  "Every crate and its release membership (permanent Postgres delete)",
  "Saved account preferences, saved views, filter memory, and playback settings",
  "Product analytics events when analytics was enabled",
  "Local preferences, playback queue, and IndexedDB collection cache",
] as const;
