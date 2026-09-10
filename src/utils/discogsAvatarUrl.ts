const DEFAULT_AVATAR_SIZE = 48;

export const buildDiscogsAvatarProxyUrl = (
  avatarUrl: string,
  size = DEFAULT_AVATAR_SIZE,
): string => {
  const params = new URLSearchParams({
    url: avatarUrl,
    w: String(size),
    h: String(size),
    q: "80",
    f: "webp",
  });

  return `/api/image-proxy?${params.toString()}`;
};
