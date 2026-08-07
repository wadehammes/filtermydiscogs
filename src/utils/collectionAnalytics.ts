import type { DiscogsRelease } from "src/types";
import type {
  CollectionStats,
  DistributionData,
  DuplicateGroup,
  FormatMixSummary,
} from "src/types/dashboard.types";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";

const MEDIA_TYPE_NAMES = new Set([
  "vinyl",
  "cassette",
  "cd",
  "file",
  "digital",
  "dvd",
  "blu-ray",
  "vhs",
  "betamax",
  "laserdisc",
]);

const formatDistributionLabel = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return trimmed;
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const getPrimaryMediaType = (release: DiscogsRelease): string | null => {
  const name = release.basic_information.formats[0]?.name?.trim();
  if (!name) {
    return null;
  }

  return formatDistributionLabel(name);
};

export const toDistributionData = (
  counts: Map<string, number>,
  limit?: number,
): DistributionData[] => {
  const sorted = Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      value: count,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return limit === undefined ? sorted : sorted.slice(0, limit);
};

export function calculateCollectionStats(
  releases: DiscogsRelease[],
): CollectionStats {
  if (releases.length === 0) {
    return {
      totalReleases: 0,
      uniqueArtists: 0,
      uniqueLabels: 0,
      averageRating: 0,
      totalStyles: 0,
      totalGenres: 0,
    };
  }

  const artistSet = new Set<string>();
  const labelSet = new Set<string>();
  const styleSet = new Set<string>();
  const genreSet = new Set<string>();
  let totalRating = 0;
  let ratedCount = 0;

  releases.forEach((release) => {
    const { artists, labels, styles, genres } = release.basic_information;

    artists.forEach((artist) => {
      if (artist.name) {
        artistSet.add(artist.name.toLowerCase());
      }
    });

    labels.forEach((label) => {
      if (label.name) {
        labelSet.add(label.name.toLowerCase());
      }
    });

    styles.forEach((style) => {
      if (style?.trim()) {
        styleSet.add(style.toLowerCase());
      }
    });

    genres?.forEach((genre) => {
      if (genre?.trim()) {
        genreSet.add(genre.toLowerCase());
      }
    });

    const ratingNum = typeof release.rating === "number" ? release.rating : 0;
    if (ratingNum > 0) {
      totalRating += ratingNum;
      ratedCount++;
    }
  });

  return {
    totalReleases: releases.length,
    uniqueArtists: artistSet.size,
    uniqueLabels: labelSet.size,
    averageRating: ratedCount > 0 ? totalRating / ratedCount : 0,
    totalStyles: styleSet.size,
    totalGenres: genreSet.size,
  };
}

export function detectDuplicates(releases: DiscogsRelease[]): DuplicateGroup[] {
  const masterIdGroups = new Map<number, DiscogsRelease[]>();
  const titleArtistGroups = new Map<string, DiscogsRelease[]>();
  const duplicateGroups: DuplicateGroup[] = [];

  releases.forEach((release) => {
    const { master_id, title, artists } = release.basic_information;

    // Group by master_id
    if (master_id) {
      if (!masterIdGroups.has(master_id)) {
        masterIdGroups.set(master_id, []);
      }
      masterIdGroups.get(master_id)?.push(release);
    }

    // Group by title + first artist
    const firstArtist = artists[0]?.name?.toLowerCase() || "";
    const titleKey = `${title.toLowerCase()}|${firstArtist}`;
    if (!titleArtistGroups.has(titleKey)) {
      titleArtistGroups.set(titleKey, []);
    }
    titleArtistGroups.get(titleKey)?.push(release);
  });

  // Add master_id duplicates (2+ releases with same master_id)
  masterIdGroups.forEach((groupReleases, masterId) => {
    if (groupReleases.length > 1) {
      duplicateGroups.push({
        key: `master_${masterId}`,
        type: "master_id",
        releases: groupReleases,
      });
    }
  });

  // Add title+artist duplicates (2+ releases with same title+artist but different master_id)
  titleArtistGroups.forEach((groupReleases, titleKey) => {
    if (groupReleases.length > 1) {
      // Only include if they have different master_ids (or no master_id)
      const masterIds = new Set(
        groupReleases
          .map((r) => r.basic_information.master_id)
          .filter((id) => id !== null && id !== undefined),
      );

      if (masterIds.size === 0 || masterIds.size < groupReleases.length) {
        duplicateGroups.push({
          key: `title_${titleKey}`,
          type: "title_artist",
          releases: groupReleases,
        });
      }
    }
  });

  return duplicateGroups;
}

export function calculateStyleDistribution(
  releases: DiscogsRelease[],
): DistributionData[] {
  const styleCounts = new Map<string, number>();

  releases.forEach((release) => {
    release.basic_information.styles.forEach((style) => {
      const normalizedStyle = style.toLowerCase();
      styleCounts.set(
        normalizedStyle,
        (styleCounts.get(normalizedStyle) || 0) + 1,
      );
    });
  });

  return Array.from(styleCounts.entries())
    .map(([label, count]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value: count,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 styles
}

export function calculateGenreDistribution(
  releases: DiscogsRelease[],
): DistributionData[] {
  const genreCounts = new Map<string, number>();

  releases.forEach((release) => {
    for (const genre of release.basic_information.genres ?? []) {
      const label = formatDistributionLabel(genre);
      if (!label) {
        continue;
      }

      genreCounts.set(label, (genreCounts.get(label) || 0) + 1);
    }
  });

  return toDistributionData(genreCounts);
}

export function calculateDecadeDistribution(
  releases: DiscogsRelease[],
): DistributionData[] {
  const decadeCounts = new Map<string, number>();

  releases.forEach((release) => {
    const year = release.basic_information.year;
    if (year && year > 0) {
      const decade = Math.floor(year / 10) * 10;
      const decadeLabel = `${decade}s`;
      decadeCounts.set(decadeLabel, (decadeCounts.get(decadeLabel) || 0) + 1);
    }
  });

  return Array.from(decadeCounts.entries())
    .map(([label, count]) => ({
      label,
      value: count,
      count,
    }))
    .sort((a, b) => {
      const decadeA = parseInt(a.label.replace("s", ""), 10);
      const decadeB = parseInt(b.label.replace("s", ""), 10);
      return decadeA - decadeB;
    });
}

export function calculateMediaTypeDistribution(
  releases: DiscogsRelease[],
): DistributionData[] {
  const mediaTypeCounts = new Map<string, number>();

  releases.forEach((release) => {
    const mediaType = getPrimaryMediaType(release);
    if (!mediaType) {
      return;
    }

    mediaTypeCounts.set(mediaType, (mediaTypeCounts.get(mediaType) || 0) + 1);
  });

  return toDistributionData(mediaTypeCounts);
}

export function calculateFormatTagDistribution(
  releases: DiscogsRelease[],
): DistributionData[] {
  const tagCounts = new Map<string, number>();

  releases.forEach((release) => {
    const countedTags = new Set<string>();

    getReleaseFormatTags(release.basic_information.formats).forEach((tag) => {
      if (MEDIA_TYPE_NAMES.has(tag.toLowerCase())) {
        return;
      }

      const label = formatDistributionLabel(tag);
      if (countedTags.has(label)) {
        return;
      }

      countedTags.add(label);
      tagCounts.set(label, (tagCounts.get(label) || 0) + 1);
    });
  });

  return toDistributionData(tagCounts, 10);
}

export function calculateFormatMixSummary(
  releases: DiscogsRelease[],
): FormatMixSummary | null {
  if (releases.length === 0) {
    return null;
  }

  const mediaTypeDistribution = calculateMediaTypeDistribution(releases);
  const topMediaType = mediaTypeDistribution[0];

  if (!topMediaType) {
    return null;
  }

  const formatTagDistribution = calculateFormatTagDistribution(releases);

  return {
    topMediaType: topMediaType.label,
    topMediaTypePercent: Math.round(
      (topMediaType.count / releases.length) * 100,
    ),
    topTags: formatTagDistribution.slice(0, 3).map(({ label, count }) => ({
      label,
      count,
    })),
  };
}

export function calculateArtistDistribution(
  releases: DiscogsRelease[],
): DistributionData[] {
  const artistCounts = new Map<string, number>();

  releases.forEach((release) => {
    release.basic_information.artists.forEach((artist) => {
      if (artist.name) {
        const artistName = artist.name;
        artistCounts.set(artistName, (artistCounts.get(artistName) || 0) + 1);
      }
    });
  });

  return Array.from(artistCounts.entries())
    .map(([label, count]) => ({
      label,
      value: count,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15 artists
}

export function calculateLabelDistribution(
  releases: DiscogsRelease[],
): DistributionData[] {
  const labelCounts = new Map<string, number>();

  releases.forEach((release) => {
    release.basic_information.labels.forEach((label) => {
      if (label.name) {
        const labelName = label.name;
        labelCounts.set(labelName, (labelCounts.get(labelName) || 0) + 1);
      }
    });
  });

  return Array.from(labelCounts.entries())
    .map(([label, count]) => ({
      label,
      value: count,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15 labels
}
