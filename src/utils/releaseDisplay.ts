import type { DiscogsRelease } from "src/types";

export const formatArtistNames = (release: DiscogsRelease): string => {
  return release.basic_information.artists
    .map((artist) => artist.name)
    .filter(Boolean)
    .join(", ");
};

interface FormatReleaseMetaLineParams {
  release: DiscogsRelease;
  includeCatno?: boolean;
}

export const formatReleaseMetaLine = ({
  release,
  includeCatno = true,
}: FormatReleaseMetaLineParams): string => {
  const { labels, year } = release.basic_information;
  const parts: string[] = [];

  if (labels[0]?.name) {
    parts.push(labels[0].name);
  }

  if (year > 0) {
    parts.push(String(year));
  }

  if (includeCatno) {
    const catno = labels[0]?.catno ? String(labels[0].catno) : "";

    if (catno) {
      parts.push(catno);
    }
  }

  return parts.join(" · ");
};
