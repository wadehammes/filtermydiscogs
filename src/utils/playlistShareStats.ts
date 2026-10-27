import type { PublicPlaylistShareStats } from "src/types/playlist.types";

export const formatPublicPlaylistShareStatCountLabel = (
  count: number,
  singular: string,
  plural: string,
): string => `${count.toLocaleString()} ${count === 1 ? singular : plural}`;

export const formatPublicPlaylistShareStatsLine = (
  stats: PublicPlaylistShareStats,
): string | null => {
  const parts: string[] = [];

  if (stats.publicViewCount > 0) {
    parts.push(
      formatPublicPlaylistShareStatCountLabel(
        stats.publicViewCount,
        "view",
        "views",
      ),
    );
  }

  if (stats.publicPlayCount > 0) {
    parts.push(
      formatPublicPlaylistShareStatCountLabel(
        stats.publicPlayCount,
        "play",
        "plays",
      ),
    );
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" · ");
};

export const publicPlaylistShareStatsHasVisibleCounts = (
  stats: PublicPlaylistShareStats,
): boolean => stats.publicViewCount > 0 || stats.publicPlayCount > 0;
