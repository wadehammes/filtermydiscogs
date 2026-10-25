import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import type { PublicShareMetadataKind } from "src/lib/public-share-metadata.server";

export const PUBLIC_SITEMAP_CACHE_TAG = "public-sitemap";

const immediateCacheRevalidate = { expire: 0 } as const;

export const publicCrateCacheTag = (crateId: string): string =>
  `public-crate:${crateId}`;

export const publicPlaylistCacheTag = (playlistId: string): string =>
  `public-playlist:${playlistId}`;

export const revalidatePublicShareSeo = ({
  kind,
  id,
}: {
  kind: PublicShareMetadataKind;
  id: string;
}): void => {
  revalidateTag(
    kind === "crate" ? publicCrateCacheTag(id) : publicPlaylistCacheTag(id),
    immediateCacheRevalidate,
  );
  revalidateTag(PUBLIC_SITEMAP_CACHE_TAG, immediateCacheRevalidate);
  revalidatePath(kind === "crate" ? `/crate/${id}` : `/playlist/${id}`);
  revalidatePath("/sitemap.xml");
};
