import { isbot } from "isbot";

export const isBot = (): boolean => {
  const userAgent = isBrowser()
    ? navigator.userAgent
    : "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

  return isbot(userAgent);
};

export const isBrowser = () => {
  return Boolean(typeof window !== "undefined");
};

export const envUrl = () => {
  return process.env.NODE_ENV === "production"
    ? "https://filtermydisco.gs"
    : "http://localhost:6767";
};

/**
 * Checks if we're running in a local development environment
 * Uses NODE_ENV which is more reliable than URL parsing
 * @returns true if NODE_ENV is "development"
 */
export const isLocalhost = (): boolean => {
  return process.env.NODE_ENV === "development";
};

/**
 * Converts a Discogs API resource_url to a web URL
 * @param params - Object containing resourceUrl and type
 * @param params.resourceUrl - The resource URL from the Discogs API (e.g., "/releases/123456")
 * @param params.type - The type of resource: "artist", "label", or "release"
 * @returns The web URL (e.g., "https://www.discogs.com/release/123456") or null if invalid
 */
export const getResourceUrl = ({
  resourceUrl,
  type,
}: {
  resourceUrl: string | undefined;
  type: "artist" | "label" | "release";
}): string | null => {
  if (!resourceUrl) return null;
  const id = resourceUrl.split("/").pop();
  return id ? `https://www.discogs.com/${type}/${id}` : null;
};
