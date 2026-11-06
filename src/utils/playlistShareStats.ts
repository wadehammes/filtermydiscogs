import type { PublicPlaylistShareStats } from "src/types/playlist.types";

export const formatPublicPlaylistShareStatCount = (count: number): string =>
  count.toLocaleString();

export const formatPublicPlaylistShareStatCountLabel = (
  count: number,
  singular: string,
  plural: string,
): string =>
  `${formatPublicPlaylistShareStatCount(count)} ${count === 1 ? singular : plural}`;

export type PublicPlaylistShareEngagementKind = "view" | "play";

export type PublicPlaylistShareEngagementItem = {
  kind: PublicPlaylistShareEngagementKind;
  count: number;
  ariaLabel: string;
};

export const listPublicPlaylistShareEngagementItems = (
  stats: PublicPlaylistShareStats,
): PublicPlaylistShareEngagementItem[] => {
  const items: PublicPlaylistShareEngagementItem[] = [];

  if (stats.publicViewCount > 0) {
    items.push({
      kind: "view",
      count: stats.publicViewCount,
      ariaLabel: formatPublicPlaylistShareStatCountLabel(
        stats.publicViewCount,
        "view",
        "views",
      ),
    });
  }

  if (stats.publicPlayCount > 0) {
    items.push({
      kind: "play",
      count: stats.publicPlayCount,
      ariaLabel: formatPublicPlaylistShareStatCountLabel(
        stats.publicPlayCount,
        "play",
        "plays",
      ),
    });
  }

  return items;
};

export const formatPublicPlaylistShareStatsLine = (
  stats: PublicPlaylistShareStats,
): string | null => {
  const labels = listPublicPlaylistShareEngagementItems(stats).map(
    (item) => item.ariaLabel,
  );

  if (labels.length === 0) {
    return null;
  }

  return labels.join(" · ");
};

export const publicPlaylistShareStatsHasVisibleCounts = (
  stats: PublicPlaylistShareStats,
): boolean => stats.publicViewCount > 0 || stats.publicPlayCount > 0;
