import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageFooter } from "src/components/Page/PageFooter.server";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
import { PublicPlaylistPage } from "src/components/PublicPlaylist/PublicPlaylist.component";
import {
  getPublicPlaylistForPage,
  getPublicPlaylistIdsForStaticGeneration,
  getPublicPlaylistMetadataForPage,
  PUBLIC_PLAYLIST_BUILD_PRERENDER_LIMIT,
} from "src/lib/public-playlist.server";
import {
  getE2eDemoPublicShareMetadataResolved,
  shouldNotFoundPublicSharePage,
} from "src/lib/public-share-e2e.server";
import { buildPublicSharePageMetadata } from "src/lib/public-share-metadata.server";

export async function generateStaticParams() {
  const ids = await getPublicPlaylistIdsForStaticGeneration(
    PUBLIC_PLAYLIST_BUILD_PRERENDER_LIMIT,
  );
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  let data: Awaited<ReturnType<typeof getPublicPlaylistMetadataForPage>> = null;

  try {
    data = await getPublicPlaylistMetadataForPage(id);
  } catch (error) {
    console.error(`Failed to load public playlist metadata for ${id}:`, error);
  }

  const resolved =
    data !== null
      ? {
          name: data.playlist.name,
          username: data.playlist.username,
          itemCount: data.trackCount,
          publicDescription: data.playlist.publicDescription,
        }
      : getE2eDemoPublicShareMetadataResolved("playlist", id);

  if (resolved === null) {
    notFound();
  }

  return buildPublicSharePageMetadata({
    kind: "playlist",
    id,
    resolved,
  });
}

export default async function PublicPlaylistRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isE2eDemoPlaylist =
    getE2eDemoPublicShareMetadataResolved("playlist", id) !== null;
  const initialPublicPlaylist = isE2eDemoPlaylist
    ? null
    : await getPublicPlaylistForPage(id);

  if (
    shouldNotFoundPublicSharePage({
      kind: "playlist",
      id,
      hasServerPayload: initialPublicPlaylist !== null,
    })
  ) {
    notFound();
  }

  return (
    <PublicAuthLayout footer={<PageFooter />} omitMainLandmark>
      <PublicPlaylistPage
        playlistId={id}
        {...(initialPublicPlaylist ? { initialPublicPlaylist } : {})}
      />
    </PublicAuthLayout>
  );
}
