import { cacheLife, cacheTag } from "next/cache";
import { isE2eMockYoutubeEmbedEnabled } from "src/constants/e2ePlayback.constants";
import {
  LOGIN_DEMO_PUBLIC_PLAYLIST_ID,
  PUBLIC_PLAYLIST_STATIC_PARAM_PLACEHOLDER_ID,
} from "src/constants/publicPlaylist.constants";
import { isValidCrateId } from "src/lib/crate-id";
import { readRuntimeDatabaseUrlFromEnv } from "src/lib/databaseUrlEnv";
import { prisma } from "src/lib/db";
import { loadPublicPlaylist } from "src/lib/public-playlist-load.server";
import { findPublicPlaylistSummaryById } from "src/lib/public-playlist-query.server";
import { publicPlaylistCacheTag } from "src/lib/public-share-cache.server";
import { reportInfrastructureFailure } from "src/lib/sentry/reportInfrastructureFailure";
import type { PublicPlaylistResponse } from "src/types/playlist.types";
import { PLAYLIST_HERO_MOSAIC_MAX_TILES } from "src/utils/playlistMosaic";

export const PUBLIC_PLAYLIST_BUILD_PRERENDER_LIMIT = 25;

const publicPlaylistStaticParamFallbackIds = (): string[] => {
  const demoIds =
    isE2eMockYoutubeEmbedEnabled() ||
    process.env.NEXT_PHASE === "phase-production-build"
      ? [LOGIN_DEMO_PUBLIC_PLAYLIST_ID]
      : [];

  return [...demoIds, PUBLIC_PLAYLIST_STATIC_PARAM_PLACEHOLDER_ID];
};

export const mergePublicPlaylistStaticParamIds = (
  ids: string[],
  limit: number,
): string[] => {
  const fallbacks = publicPlaylistStaticParamFallbackIds();
  const merged = [...fallbacks, ...ids.filter((id) => !fallbacks.includes(id))];

  return merged.slice(0, Math.max(limit, fallbacks.length));
};

async function listRecentPublicPlaylistIds(limit: number): Promise<string[]> {
  const rows = await prisma.playlist.findMany({
    where: { private: false },
    select: { id: true },
    orderBy: { updated_at: "desc" },
    take: limit,
  });

  return rows.map((row) => row.id);
}

export async function getPublicPlaylistIdsForStaticGeneration(
  limit = PUBLIC_PLAYLIST_BUILD_PRERENDER_LIMIT,
): Promise<string[]> {
  if (!readRuntimeDatabaseUrlFromEnv()) {
    return publicPlaylistStaticParamFallbackIds();
  }

  try {
    const ids = await listRecentPublicPlaylistIds(limit);
    return mergePublicPlaylistStaticParamIds(ids, limit);
  } catch (error) {
    console.error(
      "Failed to list public playlists for static generation:",
      error,
    );
    reportInfrastructureFailure("public_playlist", error, {
      operation: "static_generation",
    });
    return publicPlaylistStaticParamFallbackIds();
  }
}

export async function getPublicPlaylistForOg(playlistId: string): Promise<{
  name: string;
  username: string | null;
  coverThumbUrls: string[];
  trackCount: number;
  updatedAt: string;
} | null> {
  if (!isValidCrateId(playlistId)) {
    return null;
  }

  const payload = await loadPublicPlaylist(playlistId);
  if (!payload) {
    return null;
  }

  return {
    name: payload.playlist.name,
    username: payload.playlist.username,
    coverThumbUrls: payload.mosaicThumbUrls.slice(
      0,
      PLAYLIST_HERO_MOSAIC_MAX_TILES,
    ),
    trackCount: payload.tracks.length,
    updatedAt: payload.playlist.updated_at,
  };
}

export async function getPublicPlaylistMetadataForPage(
  playlistId: string,
): Promise<{
  playlist: {
    name: string;
    username: string | null;
    publicDescription: string | null;
  };
  trackCount: number;
} | null> {
  "use cache";
  cacheLife({ revalidate: 300 });
  cacheTag(publicPlaylistCacheTag(playlistId));

  try {
    if (!isValidCrateId(playlistId)) {
      return null;
    }

    const summary = await findPublicPlaylistSummaryById(playlistId);
    if (!summary) {
      return null;
    }

    return {
      playlist: {
        name: summary.name,
        username: summary.username,
        publicDescription: summary.publicDescription,
      },
      trackCount: summary.trackCount,
    };
  } catch (error) {
    console.error(
      `Failed to load public playlist metadata for ${playlistId}:`,
      error,
    );
    reportInfrastructureFailure("public_playlist", error, {
      operation: "metadata_for_page",
      playlistId,
    });
    return null;
  }
}

export async function getPublicPlaylistForPage(
  playlistId: string,
): Promise<PublicPlaylistResponse | null> {
  "use cache";
  cacheLife({ revalidate: 300 });
  cacheTag(publicPlaylistCacheTag(playlistId));

  try {
    if (!isValidCrateId(playlistId)) {
      return null;
    }

    return await loadPublicPlaylist(playlistId);
  } catch (error) {
    console.error(
      `Failed to load public playlist for page ${playlistId}:`,
      error,
    );
    reportInfrastructureFailure("public_playlist", error, {
      operation: "page_payload",
      playlistId,
    });
    return null;
  }
}
