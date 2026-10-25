import { cacheLife, cacheTag } from "next/cache";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "src/constants/siteMetadata";
import { PublicShareOgImage } from "src/lib/og/publicShareOgImage";
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
  const title = playlist?.name ?? "Playlist";
  const line2 = playlist?.username
    ? `by ${playlist.username} · ${SITE_NAME}`
    : SITE_NAME;

  return new ImageResponse(
    <PublicShareOgImage
      title={title}
      line2={line2}
      coverThumbUrls={playlist?.coverThumbUrls ?? []}
    />,
    {
      height: 630,
      width: 1200,
    },
  );
}
