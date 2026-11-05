"use client";

import { useMemo } from "react";
import { useHydrateDiscogsReleaseDetails } from "src/hooks/useHydrateDiscogsReleaseDetails.hook";
import type { DiscogsRelease } from "src/types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import {
  collectUniquePlaylistDiscogsReleaseIds,
  mergePlaylistReleaseWithDiscogsDetail,
  resolveDiscogsReleaseIdForPlaylistTrack,
} from "src/utils/discogsReleaseArt";
import { EMPTY_DISCOGS_RELEASE_DETAIL_MAP } from "src/utils/discogsReleaseBatchCache";

export const usePublicPlaylistReleases = ({
  tracks,
  apiReleases,
}: {
  tracks: PlaylistTrackRow[];
  apiReleases: DiscogsRelease[];
}) => {
  const apiReleaseByInstanceId = useMemo(() => {
    const map = new Map<string, DiscogsRelease>();
    for (const release of apiReleases) {
      map.set(String(release.instance_id), release);
    }
    return map;
  }, [apiReleases]);

  const uniqueDiscogsReleaseIds = useMemo(
    () =>
      collectUniquePlaylistDiscogsReleaseIds(tracks, apiReleaseByInstanceId),
    [apiReleaseByInstanceId, tracks],
  );

  const { data: hydratedReleaseDetails = EMPTY_DISCOGS_RELEASE_DETAIL_MAP } =
    useHydrateDiscogsReleaseDetails({
      releaseIds: uniqueDiscogsReleaseIds,
      enabled: uniqueDiscogsReleaseIds.length > 0,
    });

  const releaseByInstanceId = useMemo(() => {
    const map = new Map(apiReleaseByInstanceId);

    for (const track of tracks) {
      const instanceId = String(track.instance_id);
      const apiRelease = map.get(instanceId);
      const discogsId = resolveDiscogsReleaseIdForPlaylistTrack(
        track,
        apiRelease,
      );

      if (discogsId === null) {
        continue;
      }

      const detail = hydratedReleaseDetails.get(String(discogsId));

      if (!detail) {
        continue;
      }

      map.set(
        instanceId,
        mergePlaylistReleaseWithDiscogsDetail(apiRelease, detail, track),
      );
    }

    return map;
  }, [apiReleaseByInstanceId, hydratedReleaseDetails, tracks]);

  const releases = useMemo(() => {
    const seen = new Set<string>();
    const ordered: DiscogsRelease[] = [];

    for (const release of apiReleases) {
      const instanceId = String(release.instance_id);

      if (seen.has(instanceId)) {
        continue;
      }

      seen.add(instanceId);
      ordered.push(releaseByInstanceId.get(instanceId) ?? release);
    }

    for (const track of tracks) {
      const instanceId = String(track.instance_id);

      if (seen.has(instanceId)) {
        continue;
      }

      const release = releaseByInstanceId.get(instanceId);

      if (release) {
        seen.add(instanceId);
        ordered.push(release);
      }
    }

    return ordered;
  }, [apiReleases, releaseByInstanceId, tracks]);

  return { releases, releaseByInstanceId };
};
