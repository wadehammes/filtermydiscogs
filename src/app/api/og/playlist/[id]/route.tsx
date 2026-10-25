import { cacheLife, cacheTag } from "next/cache";
import { createPublicShareOgImageResponse } from "src/lib/og/createPublicShareOgImageResponse.server";
import { getPublicPlaylistForOg } from "src/lib/public-playlist.server";
import { publicPlaylistCacheTag } from "src/lib/public-share-cache.server";

async function getCachedPlaylistForOg(id: string) {
  "use cache";
  cacheLife({ revalidate: 300 });
  cacheTag(publicPlaylistCacheTag(id));

  return getPublicPlaylistForOg(id);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const playlist = await getCachedPlaylistForOg(id);
  return createPublicShareOgImageResponse({
    coverThumbUrls: playlist?.coverThumbUrls ?? [],
    itemCount: playlist?.trackCount ?? null,
    itemNoun: "track",
    kind: "playlist",
    title: playlist?.name ?? "Playlist",
    updatedAt: playlist?.updatedAt ?? null,
    username: playlist?.username ?? null,
  });
}
