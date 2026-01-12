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
 * Gets the site URL for client-side use
 * Uses NEXT_PUBLIC_SITE_URL environment variable with fallback
 * @returns The site URL (e.g., https://filtermydisco.gs or http://localhost:6767)
 */
export const getSiteUrl = (): string => {
  if (typeof window !== "undefined") {
    // Client-side: use NEXT_PUBLIC_SITE_URL or fallback to current origin
    return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  }
  // Server-side: use NEXT_PUBLIC_SITE_URL or fallback to envUrl()
  return process.env.NEXT_PUBLIC_SITE_URL || envUrl();
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

/**
 * Gets the current theme from the document
 * @returns 'light' or 'dark'
 */
const getCurrentTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  const theme = document.documentElement.getAttribute("data-theme");
  return theme === "dark" ? "dark" : "light";
};

/**
 * Creates an SVG placeholder image with a missing image icon as a data URI
 * @param width - Width of the image
 * @param height - Height of the image
 * @param backgroundColor - Background color hex (without #)
 * @param iconColor - Icon color hex (without #)
 * @returns SVG data URI
 */
const createSvgPlaceholder = (
  width: number,
  height: number,
  backgroundColor: string,
  iconColor: string,
): string => {
  // Calculate icon size (make it about 40% of the smaller dimension)
  const iconSize = Math.min(width, height) * 0.4;
  const centerX = width / 2;
  const centerY = height / 2;
  const strokeWidth = Math.max(2, iconSize / 20);

  // Create a missing image icon: rectangle with diagonal line
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#${backgroundColor}"/>
  <g transform="translate(${centerX}, ${centerY})">
    <rect x="${-iconSize / 2}" y="${-iconSize / 2}" width="${iconSize}" height="${iconSize}" fill="none" stroke="#${iconColor}" stroke-width="${strokeWidth}" rx="${iconSize / 12}"/>
    <line x1="${-iconSize / 3}" y1="${-iconSize / 3}" x2="${iconSize / 3}" y2="${iconSize / 3}" stroke="#${iconColor}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
  </g>
</svg>`;

  // Encode SVG for data URI (works in both browser and Node.js)
  const encoded =
    typeof window !== "undefined"
      ? encodeURIComponent(svg)
      : encodeURIComponent(svg);

  return `data:image/svg+xml,${encoded}`;
};

/**
 * Gets a release image URL with fallback to custom SVG placeholder
 * @param params - Object containing image URLs and options
 * @param params.thumb - The thumbnail image URL
 * @param params.cover_image - The cover image URL
 * @param params.width - Width for placeholder (default: 400)
 * @param params.height - Height for placeholder (default: 400)
 * @param params.preferCoverImage - Whether to prefer cover_image over thumb (default: true)
 * @returns The image URL, or an SVG data URI placeholder if no image is available
 */
export const getReleaseImageUrl = ({
  thumb,
  cover_image,
  width = 400,
  height = 400,
  preferCoverImage = true,
}: {
  thumb?: string | null;
  cover_image?: string | null;
  width?: number;
  height?: number;
  preferCoverImage?: boolean;
}): string => {
  const imageUrl = preferCoverImage
    ? cover_image || thumb
    : thumb || cover_image;

  if (imageUrl) {
    return imageUrl;
  }

  const theme = getCurrentTheme();
  const bgHex = theme === "dark" ? "1a1a2e" : "e8f4f8";
  const iconHex = theme === "dark" ? "a8d8ea" : "2c3e50";

  return createSvgPlaceholder(width, height, bgHex, iconHex);
};
