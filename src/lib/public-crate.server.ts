import { cacheLife, cacheTag } from "next/cache";
import { isE2eMockYoutubeEmbedEnabled } from "src/constants/e2ePlayback.constants";
import { LOGIN_DEMO_PUBLIC_CRATE_ID } from "src/constants/publicCrate.constants";
import { isValidCrateId } from "src/lib/crate-id";
import { fetchPublicCrateCoverThumbUrls } from "src/lib/crate-preview.server";
import { readRuntimeDatabaseUrlFromEnv } from "src/lib/databaseUrlEnv";
import { prisma } from "src/lib/db";
import { findPublicCrateById } from "src/lib/public-crate-query.server";
import { publicCrateCacheTag } from "src/lib/public-share-cache.server";
import { resolvePublicShareUsername } from "src/lib/public-share-username.server";
import { reportInfrastructureFailure } from "src/lib/sentry/reportInfrastructureFailure";
import { PLAYLIST_HERO_MOSAIC_MAX_TILES } from "src/utils/playlistMosaic";

export const PUBLIC_CRATE_STATIC_PARAMS_LIMIT = 100;
export const PUBLIC_CRATE_BUILD_PRERENDER_LIMIT = 25;

const publicCrateStaticParamFallbackIds = (): string[] =>
  isE2eMockYoutubeEmbedEnabled() ||
  process.env.NEXT_PHASE === "phase-production-build"
    ? [LOGIN_DEMO_PUBLIC_CRATE_ID]
    : [];

async function listRecentPublicCrateIds(limit: number): Promise<string[]> {
  "use cache";
  cacheLife({ revalidate: 300 });

  const crates = await prisma.crate.findMany({
    where: { private: false },
    select: { id: true },
    orderBy: { updated_at: "desc" },
    take: limit,
  });

  return crates.map((crate) => crate.id);
}

export async function getPublicCrateIdsForStaticGeneration(
  limit = PUBLIC_CRATE_STATIC_PARAMS_LIMIT,
): Promise<string[]> {
  if (!readRuntimeDatabaseUrlFromEnv()) {
    return publicCrateStaticParamFallbackIds();
  }

  try {
    const ids = await listRecentPublicCrateIds(limit);
    return ids.length > 0 ? ids : publicCrateStaticParamFallbackIds();
  } catch (error) {
    console.error("Failed to list public crates for static generation:", error);
    reportInfrastructureFailure("public_crate", error, {
      operation: "static_generation_ids",
    });
    return publicCrateStaticParamFallbackIds();
  }
}

export async function getPublicCrateForOg(crateId: string): Promise<{
  name: string;
  username: string | null;
  coverThumbUrls: string[];
} | null> {
  if (!isValidCrateId(crateId)) {
    return null;
  }

  const crate = await findPublicCrateById(crateId);
  if (!crate) {
    return null;
  }

  const [username, coverThumbUrls] = await Promise.all([
    resolvePublicShareUsername(crate.user_id, crate.username),
    fetchPublicCrateCoverThumbUrls({
      userId: crate.user_id,
      crateId: crate.id,
      maxThumbs: PLAYLIST_HERO_MOSAIC_MAX_TILES,
    }),
  ]);

  return {
    name: crate.name,
    username,
    coverThumbUrls,
  };
}

export async function getPublicCrateMetadataForPage(crateId: string): Promise<{
  crate: { name: string; username: string | null };
  pagination: { total: number };
} | null> {
  "use cache";
  cacheLife({ revalidate: 300 });
  cacheTag(publicCrateCacheTag(crateId));

  try {
    if (!isValidCrateId(crateId)) {
      return null;
    }

    const crate = await findPublicCrateById(crateId);
    if (!crate) {
      return null;
    }

    const total = await prisma.crateRelease.count({
      where: {
        crate_id: crate.id,
        user_id: crate.user_id,
      },
    });
    return {
      crate: { name: crate.name, username: crate.username },
      pagination: { total },
    };
  } catch (error) {
    console.error(
      `Failed to load public crate metadata for ${crateId}:`,
      error,
    );
    reportInfrastructureFailure("public_crate", error, {
      operation: "metadata_for_page",
      crateId,
    });
    return null;
  }
}
