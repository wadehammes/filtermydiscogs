const ALLOWED_DISCOGS_IMAGE_HOSTS = new Set([
  "i.discogs.com",
  "img.discogs.com",
]);

export const MAX_DISCOGS_IMAGE_URL_LENGTH = 2048;

export type DiscogsCdnKind = "i" | "img";

export const DISCOGS_CDN_ORIGIN: Record<DiscogsCdnKind, string> = {
  i: "https://i.discogs.com",
  img: "https://img.discogs.com",
};

export const isSafeDiscogsResourcePath = (path: string): boolean => {
  if (path.length === 0 || path.length > MAX_DISCOGS_IMAGE_URL_LENGTH) {
    return false;
  }

  if (!path.startsWith("/")) {
    return false;
  }

  if (path.includes("..")) {
    return false;
  }

  if (path.includes("\\")) {
    return false;
  }

  if (path.includes("@")) {
    return false;
  }

  return true;
};

export const parseAllowedDiscogsImageUrl = (value: string): URL | null => {
  if (value.length > MAX_DISCOGS_IMAGE_URL_LENGTH) {
    return null;
  }

  if (value.includes("..")) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") {
    return null;
  }

  if (!ALLOWED_DISCOGS_IMAGE_HOSTS.has(parsed.hostname)) {
    return null;
  }

  const pathAndSearch = `${parsed.pathname}${parsed.search}`;
  if (!isSafeDiscogsResourcePath(pathAndSearch)) {
    return null;
  }

  return parsed;
};

export const discogsCdnKindFromHostname = (
  hostname: string,
): DiscogsCdnKind | null => {
  if (hostname === "i.discogs.com") {
    return "i";
  }

  if (hostname === "img.discogs.com") {
    return "img";
  }

  return null;
};

export const buildDiscogsImageProxySearchParams = ({
  discogsImageUrl,
}: {
  discogsImageUrl: string;
}): URLSearchParams | null => {
  const parsed = parseAllowedDiscogsImageUrl(discogsImageUrl);
  if (!parsed) {
    return null;
  }

  const cdn = discogsCdnKindFromHostname(parsed.hostname);
  if (!cdn) {
    return null;
  }

  const path = `${parsed.pathname}${parsed.search}`;

  return new URLSearchParams({ cdn, path });
};

export type ImageProxyFetchTarget = {
  cdn: DiscogsCdnKind;
  path: string;
};

export const resolveImageProxyFetchTarget = (
  searchParams: URLSearchParams,
): ImageProxyFetchTarget | null => {
  const cdnParam = searchParams.get("cdn");
  const pathParam = searchParams.get("path");

  if (cdnParam === "i" || cdnParam === "img") {
    if (pathParam && isSafeDiscogsResourcePath(pathParam)) {
      return { cdn: cdnParam, path: pathParam };
    }

    return null;
  }

  const urlParam = searchParams.get("url");
  if (!urlParam) {
    return null;
  }

  const parsed = parseAllowedDiscogsImageUrl(urlParam);
  if (!parsed) {
    return null;
  }

  const cdn = discogsCdnKindFromHostname(parsed.hostname);
  if (!cdn) {
    return null;
  }

  return {
    cdn,
    path: `${parsed.pathname}${parsed.search}`,
  };
};

interface FetchDiscogsCdnImageParams {
  cdn: DiscogsCdnKind;
  path: string;
  init?: RequestInit;
}

export const fetchDiscogsCdnImage = ({
  cdn,
  path,
  init,
}: FetchDiscogsCdnImageParams): Promise<Response> => {
  const origin = DISCOGS_CDN_ORIGIN[cdn];

  return fetch(`${origin}${path}`, init);
};
