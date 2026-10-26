import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  findPublicCrateById,
  listPublicCrateIdsFrom,
} from "src/lib/public-crate-query.server";
import { findPublicPlaylistById } from "src/lib/public-playlist-query.server";
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

const revalidatePublicShareWhenPublic = async (
  kind: PublicShareMetadataKind,
  id: string,
): Promise<void> => {
  const isPublic =
    kind === "crate"
      ? await findPublicCrateById(id)
      : await findPublicPlaylistById(id);

  if (!isPublic) {
    return;
  }

  revalidatePublicShareSeo({ kind, id });
};

export const revalidatePublicCrateShareWhenPublic = (
  crateId: string,
): Promise<void> => revalidatePublicShareWhenPublic("crate", crateId);

export const revalidatePublicCrateSharesWhenPublic = async (
  crateIds: readonly string[],
): Promise<void> => {
  const publicIds = await listPublicCrateIdsFrom(crateIds);

  if (publicIds.length === 0) {
    return;
  }

  for (const id of publicIds) {
    revalidateTag(publicCrateCacheTag(id), immediateCacheRevalidate);
    revalidatePath(`/crate/${id}`);
  }

  revalidateTag(PUBLIC_SITEMAP_CACHE_TAG, immediateCacheRevalidate);
  revalidatePath("/sitemap.xml");
};

export const revalidatePublicPlaylistShareWhenPublic = (
  playlistId: string,
): Promise<void> => revalidatePublicShareWhenPublic("playlist", playlistId);
