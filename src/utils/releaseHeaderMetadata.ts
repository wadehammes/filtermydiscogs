import type { DiscogsArtist, DiscogsLabel } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

export const mergeReleaseHeaderArtists = (
  artists: DiscogsArtist[],
  detailArtists: DiscogsReleaseDetail["artists"],
): DiscogsArtist[] => {
  if (!detailArtists?.length) {
    return artists;
  }

  return artists.map((artist, index) => {
    const detailArtist = detailArtists[index] as DiscogsArtist | undefined;
    if (!detailArtist) {
      return artist;
    }

    const merged: DiscogsArtist = { ...artist };
    const id = artist.id ?? detailArtist.id;
    const resourceUrl = artist.resource_url ?? detailArtist.resource_url;

    if (id !== undefined) {
      merged.id = id;
    }

    if (resourceUrl !== undefined) {
      merged.resource_url = resourceUrl;
    }

    return merged;
  });
};

export const mergeReleaseHeaderLabel = (
  label: DiscogsLabel | undefined,
  detailLabel: DiscogsLabel | undefined,
): DiscogsLabel | undefined => {
  if (!(label || detailLabel)) {
    return undefined;
  }

  const merged: DiscogsLabel = {
    name: label?.name ?? detailLabel?.name ?? "",
  };
  const id = label?.id ?? detailLabel?.id;
  const resourceUrl = label?.resource_url ?? detailLabel?.resource_url;
  const catno = label?.catno ?? detailLabel?.catno;

  if (id !== undefined) {
    merged.id = id;
  }

  if (resourceUrl !== undefined) {
    merged.resource_url = resourceUrl;
  }

  if (catno !== undefined) {
    merged.catno = catno;
  }

  return merged;
};
