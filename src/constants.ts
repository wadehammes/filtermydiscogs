export const ERROR_FETCHING =
  "Failed to fetch collection. Check spelling or this collection could be private.";
export const USERNAME_STORAGE_PARAM = "fmd_username";

export const DEFAULT_SOCIAL_IMAGE_ALT =
  "FilterMyDiscogs app preview showing release cards, filters, crates, and collection insights";

export const DEFAULT_OPEN_GRAPH_IMAGE = {
  url: "/opengraph-image.png",
  width: 1920,
  height: 1080,
  alt: DEFAULT_SOCIAL_IMAGE_ALT,
} as const;

export const DEFAULT_TWITTER_IMAGE = {
  url: "/twitter-image.png",
  alt: DEFAULT_SOCIAL_IMAGE_ALT,
} as const;
