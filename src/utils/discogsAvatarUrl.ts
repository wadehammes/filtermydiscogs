import { buildDiscogsImageProxySearchParams } from "src/lib/discogs-image-proxy-url";

const DEFAULT_AVATAR_SIZE = 48;

export const buildDiscogsAvatarProxyUrl = (
  avatarUrl: string,
  size = DEFAULT_AVATAR_SIZE,
): string => {
  const params =
    buildDiscogsImageProxySearchParams({ discogsImageUrl: avatarUrl }) ??
    new URLSearchParams({ url: avatarUrl });

  params.set("w", String(size));
  params.set("h", String(size));
  params.set("q", "80");
  params.set("f", "webp");

  return `/api/image-proxy?${params.toString()}`;
};
