"use client";

import { useMemo } from "react";
import { useTrackMetadataMap } from "src/hooks/queries/useTrackMetadataQuery";
import { useShowDjMetadataOnTracks } from "src/hooks/useShowDjMetadataOnTracks.hook";
import type { DiscogsRelease, DiscogsTrack } from "src/types";
import type { TrackDjMetadata } from "src/types/trackMetadata.types";
import {
  buildTrackMetadataLookupFromRelease,
  buildTrackMetadataLookupFromTrack,
} from "src/utils/trackMetadataLookup";

export const useReleaseTrackDjMetadata = ({
  release,
  tracks,
  enabled,
}: {
  release: DiscogsRelease;
  tracks: DiscogsTrack[];
  enabled: boolean;
}) => {
  const showDjMetadata = useShowDjMetadataOnTracks();

  const lookups = useMemo(
    () =>
      tracks
        .map((track) =>
          buildTrackMetadataLookupFromTrack({
            track,
            release,
          }),
        )
        .filter(
          (lookup): lookup is NonNullable<typeof lookup> => lookup !== null,
        ),
    [release, tracks],
  );

  const { metadataById, isLoading } = useTrackMetadataMap({
    lookups,
    enabled: showDjMetadata && enabled && lookups.length > 0,
  });

  const getTrackDjMetadata = useMemo(
    () =>
      (position: string): TrackDjMetadata | null | undefined =>
        metadataById[position] ?? null,
    [metadataById],
  );

  return {
    showDjMetadata,
    getTrackDjMetadata,
    isDjMetadataLoading: isLoading,
  };
};

export const useCrateReleaseDjMetadata = ({
  releases,
  enabled,
}: {
  releases: DiscogsRelease[];
  enabled: boolean;
}) => {
  const showDjMetadata = useShowDjMetadataOnTracks();

  const lookups = useMemo(
    () =>
      releases
        .map((release) => buildTrackMetadataLookupFromRelease(release))
        .filter(
          (lookup): lookup is NonNullable<typeof lookup> => lookup !== null,
        ),
    [releases],
  );

  const { metadataById, isLoading } = useTrackMetadataMap({
    lookups,
    enabled: showDjMetadata && enabled && lookups.length > 0,
  });

  return {
    showDjMetadata,
    metadataById,
    isDjMetadataLoading: isLoading,
  };
};
