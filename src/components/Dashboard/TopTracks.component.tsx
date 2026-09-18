"use client";

import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";
import { EmptyState } from "src/components/EmptyState/EmptyState.component";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import { useTopUserTracksQuery } from "src/hooks/queries/useTopUserTracksQuery";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import dashboardCardStyles from "src/styles/modules/dashboard-card.module.css";
import type { DiscogsRelease } from "src/types";
import type { TopUserTrack } from "src/types/dashboard.types";
import { buildReleaseIndexFromList } from "src/utils/collectionReleaseLookup";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl } from "src/utils/helpers";
import { buildCatalogTitleByTrackKey } from "src/utils/userTrack";
import { DashboardTrackItem } from "./DashboardTrackItem.component";
import styles from "./TopTracks.module.css";

interface TopTracksProps {
  onReleaseClick?: (instanceId: string) => void;
}

const COLUMN_COPY = {
  played: {
    title: "Most played",
    hint: "Each time you start a track from playback.",
  },
  listened: {
    title: "Most listened",
    hint: "30 seconds in one go, or the full track if shorter.",
  },
} as const;

const COVER_PX = 48;

interface TopTracksColumnProps {
  sectionId: string;
  copy: (typeof COLUMN_COPY)[keyof typeof COLUMN_COPY];
  tracks: TopUserTrack[];
  metric: "play" | "listen";
  emptyMessage: string;
  coverUrlByInstanceId: Map<string, string>;
  catalogTitleByTrackKey: Map<string, string>;
  releaseIndex: Map<string, DiscogsRelease>;
  onReleaseClick?: (instanceId: string) => void;
}

function TopTracksColumn({
  sectionId,
  copy,
  tracks,
  metric,
  emptyMessage,
  coverUrlByInstanceId,
  catalogTitleByTrackKey,
  releaseIndex,
  onReleaseClick,
}: TopTracksColumnProps) {
  return (
    <section className={styles.column} aria-labelledby={sectionId}>
      <header className={styles.columnIntro}>
        <h3 id={sectionId} className={styles.columnHeading}>
          {copy.title}
        </h3>
        <p className={styles.columnHint}>{copy.hint}</p>
      </header>
      <div className={styles.columnBody}>
        {tracks.length === 0 ? (
          <p className={styles.columnEmpty}>{emptyMessage}</p>
        ) : (
          <div className={styles.trackList}>
            {tracks.map((track) => (
              <div
                key={`${metric}-${track.track_key}`}
                className={dashboardCardStyles.releaseRow}
              >
                <DashboardTrackItem
                  track={track}
                  metric={metric}
                  {...definedProps({
                    release: releaseIndex.get(String(track.instance_id)),
                    onReleaseClick,
                    coverUrl: coverUrlByInstanceId.get(
                      String(track.instance_id),
                    ),
                    catalogTrackTitle: catalogTitleByTrackKey.get(
                      track.track_key,
                    ),
                  })}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function TopTracks({ onReleaseClick }: TopTracksProps) {
  const { data, isLoading, error } = useTopUserTracksQuery({ limit: 10 });
  const allReleases = useAllReleases();
  const mostPlayed = data?.most_played ?? [];
  const mostListened = data?.most_listened ?? [];

  const releaseIndex = useMemo(
    () => buildReleaseIndexFromList(allReleases ?? []),
    [allReleases],
  );

  const leaderboardTracks = useMemo(
    () => [...mostPlayed, ...mostListened],
    [mostPlayed, mostListened],
  );

  const uniqueReleaseIds = useMemo(() => {
    const ids = new Set<string>();

    for (const track of leaderboardTracks) {
      const release = releaseIndex.get(String(track.instance_id));
      const releaseId = release?.basic_information?.id;

      if (releaseId != null) {
        ids.add(String(releaseId));
      }
    }

    return [...ids];
  }, [leaderboardTracks, releaseIndex]);

  const releaseDetailQueries = useQueries({
    queries: uniqueReleaseIds.map((releaseId) => ({
      ...discogsReleaseQueryOptions(releaseId),
      enabled: !isLoading && uniqueReleaseIds.length > 0,
    })),
  });

  const coverUrlByInstanceId = useMemo(() => {
    const map = new Map<string, string>();

    for (const release of allReleases ?? []) {
      const url = getReleaseImageUrl({
        thumb: release.basic_information.thumb,
        cover_image: release.basic_information.cover_image,
        width: COVER_PX,
        height: COVER_PX,
        preferCoverImage: true,
        fallbackToPlaceholder: false,
      });

      if (url) {
        map.set(String(release.instance_id), url);
      }
    }

    return map;
  }, [allReleases]);

  const catalogTitleByTrackKey = useMemo(() => {
    const releaseDetailById = new Map(
      uniqueReleaseIds.map((releaseId, index) => [
        releaseId,
        releaseDetailQueries[index]?.data,
      ]),
    );

    return buildCatalogTitleByTrackKey(
      leaderboardTracks,
      releaseIndex,
      releaseDetailById,
    );
  }, [leaderboardTracks, releaseDetailQueries, releaseIndex, uniqueReleaseIds]);

  if (isLoading) {
    return <p className={styles.status}>Loading playback stats…</p>;
  }

  if (error) {
    return (
      <p className={styles.error}>
        Unable to load most played and listened tracks.
      </p>
    );
  }

  if (mostPlayed.length === 0 && mostListened.length === 0) {
    return (
      <EmptyState
        variant="inline"
        title="No playback stats yet."
        description="Play tracks from your collection to see what you reach for most."
        className={styles.emptyState}
      >
        <Link href="/releases" className={styles.emptyStateLink}>
          Go to Releases
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className={styles.columns}>
      <TopTracksColumn
        sectionId="top-tracks-played"
        copy={COLUMN_COPY.played}
        tracks={mostPlayed}
        metric="play"
        emptyMessage="No plays recorded yet."
        coverUrlByInstanceId={coverUrlByInstanceId}
        catalogTitleByTrackKey={catalogTitleByTrackKey}
        releaseIndex={releaseIndex}
        {...definedProps({ onReleaseClick })}
      />
      <TopTracksColumn
        sectionId="top-tracks-listened"
        copy={COLUMN_COPY.listened}
        tracks={mostListened}
        metric="listen"
        emptyMessage="No listens recorded yet."
        coverUrlByInstanceId={coverUrlByInstanceId}
        catalogTitleByTrackKey={catalogTitleByTrackKey}
        releaseIndex={releaseIndex}
        {...definedProps({ onReleaseClick })}
      />
    </div>
  );
}
