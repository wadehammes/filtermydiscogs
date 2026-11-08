"use client";

import type { ReactNode } from "react";
import { Fragment, useCallback, useMemo } from "react";
import { ApiFetchError } from "src/api/apiFetchError";
import heroStyles from "src/components/PublicPlaylist/PublicPlaylistSummaryHero.module.css";
import { ReleaseHeaderArtistLine } from "src/components/ReleaseCard/ReleaseHeaderLinks.component";
import { useRegisterPlaybackReleaseClick } from "src/context/playbackReleaseClick.context";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import { usePlaylistPlayback } from "src/hooks/usePlaylistPlayback.hook";
import { usePublicSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import { toPublicPlaylistReleaseSnapshot } from "src/lib/release-data-validation";
import type { DiscogsLabel } from "src/types/discogs-release.types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import { definedProps } from "src/utils/definedProps";
import {
  buildDiscogsReleaseFromDetail,
  resolveDiscogsReleaseDetailCoverUri,
} from "src/utils/discogsReleaseArt";
import { getResourceUrl } from "src/utils/helpers";
import {
  buildPlaylistRowsFromDiscogsReleaseDetail,
  countPlaylistTracksWithYoutubeId,
  formatPublicReleaseCommunityMetaParts,
  resolvePublicReleaseCatalogNumbers,
  resolvePublicReleaseHeroDateMetaParts,
} from "src/utils/publicReleaseTracks";
import {
  formatDiscogsCreditNames,
  getCommunityRatingFromReleaseDetail,
} from "src/utils/releaseDisplay";
import { mergeReleaseHeaderLabel } from "src/utils/releaseHeaderMetadata";

export type UsePublicReleaseListenPageStateParams = {
  releaseId: string;
  initialDiscogsReleaseDetail?: DiscogsReleaseDetail;
};

const buildSecondaryMetaLines = (detail: DiscogsReleaseDetail): string[] => {
  const lines: string[] = [];
  const catnos = resolvePublicReleaseCatalogNumbers(detail);

  if (catnos.length > 0) {
    lines.push(catnos.join(" · "));
  }

  const trimmedCountry =
    typeof detail.country === "string" ? detail.country.trim() : "";

  if (trimmedCountry) {
    lines.push(trimmedCountry);
  }

  lines.push(...formatPublicReleaseCommunityMetaParts(detail));

  return lines.filter((line) => line.trim().length > 0);
};

export const usePublicReleaseListenPageState = ({
  releaseId,
  initialDiscogsReleaseDetail,
}: UsePublicReleaseListenPageStateParams) => {
  const { data, isPending, isError, error, refetch, isFetching } =
    useDiscogsReleaseQuery({
      releaseId,
      enabled: true,
      ...definedProps({ initialDiscogsReleaseDetail }),
    });

  const detail = data ?? null;

  const collectionRelease = useMemo(() => {
    if (!detail) {
      return null;
    }

    return toPublicPlaylistReleaseSnapshot(
      buildDiscogsReleaseFromDetail(detail, releaseId),
    );
  }, [detail, releaseId]);

  const orderedTracks = useMemo((): PlaylistTrackRow[] => {
    if (!detail) {
      return [];
    }

    return buildPlaylistRowsFromDiscogsReleaseDetail({
      detail,
      sortOrderBase: 0,
    });
  }, [detail]);

  const releases = useMemo(() => {
    if (!collectionRelease) {
      return [];
    }

    return [collectionRelease];
  }, [collectionRelease]);

  const { selectedRelease, handleReleaseClick, handleCloseModal } =
    usePublicSelectedReleaseModal({ fallbackReleases: releases });

  useRegisterPlaybackReleaseClick(handleReleaseClick);

  const { playPlaylistTrack, playPlaylistTracks } = usePlaylistPlayback({
    releases,
  });

  const coverHeroUrl = useMemo((): string | null => {
    if (!detail) {
      return null;
    }

    const primary = resolveDiscogsReleaseDetailCoverUri(detail).trim();

    if (primary) {
      return primary;
    }

    const thumb = detail.thumb?.trim();

    return thumb || null;
  }, [detail]);

  const heroMetaLine = useMemo((): ReactNode => {
    if (!detail) {
      return "";
    }

    const trackCount = orderedTracks.length;
    const trackLabel = `${trackCount} track${trackCount !== 1 ? "s" : ""}`;
    const dateParts = resolvePublicReleaseHeroDateMetaParts(detail);

    const segments: ReactNode[] = [];
    const artists = detail.artists ?? [];

    if (artists.length > 0) {
      segments.push(
        <ReleaseHeaderArtistLine
          key="public-release-hero-artists"
          artists={artists}
          className={heroStyles.metaLineArtists}
          linkClassName={heroStyles.discogsLink}
        />,
      );
    } else {
      const artistPlain = formatDiscogsCreditNames(detail.artists);

      if (artistPlain.trim()) {
        segments.push(artistPlain);
      }
    }

    const labelRow = detail.labels?.[0];
    let primaryLabel: DiscogsLabel | undefined;

    if (labelRow && typeof labelRow.name === "string") {
      primaryLabel = { name: labelRow.name };

      if (typeof labelRow.id === "number") {
        primaryLabel.id = labelRow.id;
      }

      if (typeof labelRow.resource_url === "string") {
        primaryLabel.resource_url = labelRow.resource_url;
      }

      if (typeof labelRow.catno === "string") {
        primaryLabel.catno = labelRow.catno;
      }
    }

    const heroLabel = mergeReleaseHeaderLabel(undefined, primaryLabel);
    const labelName = heroLabel?.name?.trim();

    if (labelName && heroLabel) {
      const labelUrl = getResourceUrl({
        resourceUrl: heroLabel.resource_url,
        type: "label",
        id: heroLabel.id,
      });

      segments.push(
        labelUrl ? (
          <a
            key="public-release-hero-label"
            href={labelUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`View ${labelName} on Discogs`}
            className={heroStyles.discogsLink}
          >
            {labelName}
          </a>
        ) : (
          labelName
        ),
      );
    }

    segments.push(trackLabel, ...dateParts);

    const nonEmpty = segments.filter((node) => {
      if (typeof node === "string") {
        return node.trim().length > 0;
      }

      return node != null;
    });

    return (
      <>
        {nonEmpty.map((node, index) => (
          <Fragment key={`public-release-hero-meta-${index}`}>
            {index > 0 ? (
              <span className={heroStyles.metaSeparator} aria-hidden>
                {" "}
                ·{" "}
              </span>
            ) : null}
            {node}
          </Fragment>
        ))}
      </>
    );
  }, [detail, orderedTracks]);

  const secondaryMetaLines = useMemo(() => {
    if (!detail) {
      return [];
    }

    return buildSecondaryMetaLines(detail);
  }, [detail]);

  const communityRating = useMemo(
    () => getCommunityRatingFromReleaseDetail(detail ?? undefined),
    [detail],
  );

  const playableTrackCount = useMemo(
    () => countPlaylistTracksWithYoutubeId(orderedTracks),
    [orderedTracks],
  );

  const discogsUri =
    detail && typeof detail.uri === "string" ? detail.uri.trim() : "";

  const handlePlayAll = useCallback(() => {
    if (playableTrackCount === 0) {
      return;
    }

    playPlaylistTracks(orderedTracks);
  }, [orderedTracks, playableTrackCount, playPlaylistTracks]);

  const handlePlayTrack = useCallback(
    (track: PlaylistTrackRow) => {
      playPlaylistTrack(track, orderedTracks);
    },
    [orderedTracks, playPlaylistTrack],
  );

  const is404Error =
    isError && error instanceof ApiFetchError && error.status === 404;

  return {
    collectionRelease,
    coverHeroUrl,
    detail,
    discogsUri,
    error,
    handleCloseModal,
    handlePlayAll,
    handlePlayTrack,
    handleReleaseClick,
    heroMetaLine,
    is404Error,
    isError,
    isFetching,
    isPending,
    isPendingSkeleton: isPending && !detail,
    communityRating,
    orderedTracks,
    playableTrackCount,
    refetch,
    secondaryMetaLines,
    selectedRelease,
  };
};
