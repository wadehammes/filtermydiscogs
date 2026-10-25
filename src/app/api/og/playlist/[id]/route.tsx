import { cacheLife, cacheTag } from "next/cache";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "src/constants/siteMetadata";
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
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        fontSize: 48,
        height: "100%",
        justifyContent: "center",
        padding: 64,
        width: "100%",
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 28, marginTop: 24, opacity: 0.9 }}>{line2}</div>
    </div>,
    {
      height: 630,
      width: 1200,
    },
  );
}
