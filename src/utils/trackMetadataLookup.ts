import type { DiscogsRelease, DiscogsTrack } from "src/types";
import type { TrackMetadataLookup } from "src/types/trackMetadata.types";
import { formatArtistNames } from "src/utils/releaseDisplay";

const normalizeLookupText = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

export const getPrimaryArtistName = (release: DiscogsRelease): string => {
  const primaryArtist = release.basic_information.artists[0]?.name?.trim();

  if (primaryArtist) {
    return primaryArtist;
  }

  return normalizeLookupText(formatArtistNames(release));
};

export const getTrackLookupArtist = ({
  track,
  release,
}: {
  track: DiscogsTrack;
  release: DiscogsRelease;
}): string => {
  const trackArtist = track.artists?.[0]?.name?.trim();

  if (trackArtist) {
    return trackArtist;
  }

  return getPrimaryArtistName(release);
};

export const buildTrackMetadataLookup = ({
  id,
  artist,
  title,
}: TrackMetadataLookup): TrackMetadataLookup | null => {
  const normalizedArtist = normalizeLookupText(artist);
  const normalizedTitle = normalizeLookupText(title);

  if (!(normalizedArtist && normalizedTitle)) {
    return null;
  }

  return {
    id,
    artist: normalizedArtist,
    title: normalizedTitle,
  };
};

export const buildTrackMetadataLookupFromTrack = ({
  track,
  release,
}: {
  track: DiscogsTrack;
  release: DiscogsRelease;
}): TrackMetadataLookup | null =>
  buildTrackMetadataLookup({
    id: track.position,
    artist: getTrackLookupArtist({ track, release }),
    title: track.title,
  });

export const buildTrackMetadataLookupFromRelease = (
  release: DiscogsRelease,
): TrackMetadataLookup | null =>
  buildTrackMetadataLookup({
    id: String(release.instance_id),
    artist: getPrimaryArtistName(release),
    title: release.basic_information.title,
  });
