import { DEFAULT_SITE_URL } from "src/constants/siteMetadata";

export const isBrowser = () => {
  return Boolean(typeof window !== "undefined");
};

const envUrl = () => {
  return process.env.NODE_ENV === "production"
    ? DEFAULT_SITE_URL
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
 * Creates an SVG placeholder: solid black with a subtle X
 * @param width - Width of the image
 * @param height - Height of the image
 * @returns SVG data URI
 */
const createSvgPlaceholder = (width: number, height: number): string => {
  const iconSize = Math.min(width, height) * 0.35;
  const centerX = width / 2;
  const centerY = height / 2;
  const half = iconSize / 2;
  const strokeWidth = Math.max(1.5, iconSize / 16);

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#000000"/>
  <g stroke="#ffffff" stroke-opacity="0.28" stroke-width="${strokeWidth}" stroke-linecap="round">
    <line x1="${centerX - half}" y1="${centerY - half}" x2="${centerX + half}" y2="${centerY + half}"/>
    <line x1="${centerX + half}" y1="${centerY - half}" x2="${centerX - half}" y2="${centerY + half}"/>
  </g>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
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

  return createSvgPlaceholder(width, height);
};
