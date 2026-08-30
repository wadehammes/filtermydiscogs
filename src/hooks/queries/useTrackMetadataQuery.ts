"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { TrackMetadataQueryKeys } from "src/hooks/queries/querykeys.constants";
import type {
  TrackDjMetadata,
  TrackMetadataLookup,
} from "src/types/trackMetadata.types";

const TRACK_METADATA_STALE_MS = 1000 * 60 * 60 * 24 * 7;

export const useTrackMetadataQuery = ({
  lookups,
  enabled = true,
}: {
  lookups: TrackMetadataLookup[];
  enabled?: boolean;
}) => {
  const stableLookups = lookups.filter(
    (lookup) => lookup.artist.trim() && lookup.title.trim(),
  );

  return useQuery({
    queryKey: TrackMetadataQueryKeys.byLookups(stableLookups),
    queryFn: () =>
      api.trackMetadataBatch({
        lookups: stableLookups,
      }),
    enabled: enabled && stableLookups.length > 0,
    staleTime: TRACK_METADATA_STALE_MS,
    gcTime: TRACK_METADATA_STALE_MS,
    select: (response) => response.results,
  });
};

export const useTrackMetadataMap = ({
  lookups,
  enabled = true,
}: {
  lookups: TrackMetadataLookup[];
  enabled?: boolean;
}): {
  metadataById: Record<string, TrackDjMetadata | null>;
  isLoading: boolean;
  isError: boolean;
} => {
  const query = useTrackMetadataQuery({ lookups, enabled });

  return {
    metadataById: query.data ?? {},
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
