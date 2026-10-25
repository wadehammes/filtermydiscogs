"use client";

import classNames from "classnames";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import Button from "src/components/Button/Button.component";
import { LoginConnectButton } from "src/components/LoginConnectButton/LoginConnectButton.component";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { PlaybackScrollSpacer } from "src/components/PlaybackScrollSpacer/PlaybackScrollSpacer.component";
import { PublicPlaylistSummaryHero } from "src/components/PublicPlaylist/PublicPlaylistSummaryHero.component";
import { PublicPlaylistTrackItem } from "src/components/PublicPlaylistTrackItem/PublicPlaylistTrackItem.component";
import { PublicReleaseModal } from "src/components/PublicReleaseModal/PublicReleaseModal.component";
import { PublicSharedViewBanner } from "src/components/PublicSharedViewBanner/PublicSharedViewBanner.component";
import { PublicSharePlaybackShell } from "src/components/PublicSharePlaybackShell/PublicSharePlaybackShell.component";
import tracklistStyles from "src/components/ReleaseTracklist/ReleaseTracklist.module.css";
import { PUBLIC_SHARED_PLAYLIST_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import { PUBLIC_PLAYLIST_MARKETING_BULLETS } from "src/constants/marketingPublicCopy";
import { SITE_LEAD } from "src/constants/siteMetadata";
import { useAuth } from "src/context/auth.context";
import { useRegisterPlaybackReleaseClick } from "src/context/playbackReleaseClick.context";
import { usePublicPlaylistQuery } from "src/hooks/queries/usePublicPlaylistQuery";
import { usePlaylistPlayback } from "src/hooks/usePlaylistPlayback.hook";
import { usePublicPlaylistReleases } from "src/hooks/usePublicPlaylistReleases.hook";
import { usePublicSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import PlayIcon from "src/styles/icons/play-thin.svg";
import type {
  PlaylistTrackRow,
  PublicPlaylistResponse,
} from "src/types/playlist.types";
import { formatDate } from "src/utils/dateHelpers";
import { writeLastPlayedPlaylistId } from "src/utils/lastPlayedPlaylistStorage";
import {
  buildPlaylistMosaicThumbUrls,
  PLAYLIST_HERO_MOSAIC_MAX_TILES,
} from "src/utils/playlistMosaic";
import { orderPlaylistTracks } from "src/utils/playlistPlayback";
import styles from "./PublicPlaylist.module.css";

type MarketingBullet = {
  label: string;
  text: string;
};

const PublicMarketingFeatureList = ({
  bullets,
}: {
  bullets: readonly MarketingBullet[];
}) => (
  <ul className={styles.list}>
    {bullets.map((bullet) => (
      <li key={bullet.label} className={styles.listItem}>
        <strong>{bullet.label}</strong>: {bullet.text}
      </li>
    ))}
  </ul>
);

interface PublicPlaylistClientProps {
  playlistId: string;
  initialPublicPlaylist?: PublicPlaylistResponse;
}

export const PublicPlaylistClient = ({
  playlistId,
  initialPublicPlaylist,
}: PublicPlaylistClientProps) => {
  const { data, isPending, isError, error } = usePublicPlaylistQuery({
    playlistId,
    ...(initialPublicPlaylist !== undefined ? { initialPublicPlaylist } : {}),
  });

  const orderedTracks = useMemo(
    () => orderPlaylistTracks(data?.tracks ?? []),
    [data?.tracks],
  );

  const apiReleases = useMemo(() => data?.releases ?? [], [data?.releases]);

  const { releases, releaseByInstanceId } = usePublicPlaylistReleases({
    tracks: orderedTracks,
    apiReleases,
  });

  const coverThumbUrls = useMemo(() => {
    const heroMaxTiles = PLAYLIST_HERO_MOSAIC_MAX_TILES;
    const fromTracks = buildPlaylistMosaicThumbUrls({
      tracks: orderedTracks,
      releaseByInstanceId,
      maxTiles: heroMaxTiles,
    });

    if (fromTracks.length > 0) {
      return fromTracks;
    }

    return (data?.mosaicThumbUrls ?? []).slice(0, heroMaxTiles);
  }, [orderedTracks, releaseByInstanceId, data?.mosaicThumbUrls]);

  const { selectedRelease, handleReleaseClick, handleCloseModal } =
    usePublicSelectedReleaseModal({ fallbackReleases: releases });

  useRegisterPlaybackReleaseClick(handleReleaseClick);

  const { playPlaylistTrack, playPlaylistTracks } = usePlaylistPlayback({
    releases,
  });

  const {
    state: { userId },
    login,
  } = useAuth();

  const handlePlayAll = useCallback(() => {
    if (orderedTracks.length === 0) {
      return;
    }

    if (userId) {
      writeLastPlayedPlaylistId(userId, playlistId);
    }

    playPlaylistTracks(orderedTracks);
  }, [orderedTracks, playPlaylistTracks, playlistId, userId]);

  const handlePlayTrack = useCallback(
    (track: PlaylistTrackRow) => {
      if (userId) {
        writeLastPlayedPlaylistId(userId, playlistId);
      }

      playPlaylistTrack(track, orderedTracks);
    },
    [orderedTracks, playPlaylistTrack, playlistId, userId],
  );

  if (isPending && !data) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <PageLoader message="Loading playlist..." />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load playlist";

    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.section}>
            <h2 className={styles.heading}>Playlist not found</h2>
            <p className={styles.text}>
              {errorMessage.includes("private")
                ? "This playlist is private and cannot be viewed."
                : "This playlist doesn't exist or has been removed."}
            </p>
            <p className={styles.text}>
              <Link href="/" className={styles.inlineLink}>
                Return to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { playlist } = data;
  const trackCount = orderedTracks.length;
  const heroMetaParts = [
    playlist.username ? `By ${playlist.username}` : null,
    `${trackCount} track${trackCount !== 1 ? "s" : ""}`,
    playlist.updated_at
      ? `Updated ${formatDate(String(playlist.updated_at))}`
      : null,
  ].filter(Boolean);

  return (
    <>
      <PublicSharedViewBanner kind="playlist" username={playlist.username} />
      <div className={styles.container}>
        <div className={styles.content}>
          <section className={styles.playlistWorkspace}>
            <PublicPlaylistSummaryHero
              className={styles.playlistAside}
              title={playlist.name}
              coverThumbUrls={coverThumbUrls}
              coverLabel={`${playlist.name} cover art collage`}
              metaLine={heroMetaParts.join(" · ")}
              actions={
                <Button
                  variant="primary"
                  size="md"
                  className={styles.playButton}
                  onPress={handlePlayAll}
                  disabled={trackCount === 0}
                >
                  <span className={styles.playButtonIcon} aria-hidden>
                    <PlayIcon />
                  </span>
                  Play All
                </Button>
              }
            />

            <div className={styles.playlistMain}>
              {orderedTracks.length > 0 ? (
                <>
                  <h2 className={styles.trackListHeading}>Tracks</h2>
                  <ul
                    className={classNames(
                      tracklistStyles.tracklist,
                      styles.tracklistPanel,
                    )}
                  >
                    {orderedTracks.map((track, trackIndex) => (
                      <PublicPlaylistTrackItem
                        key={track.track_key}
                        index={trackIndex + 1}
                        track={track}
                        release={
                          releaseByInstanceId.get(String(track.instance_id)) ??
                          null
                        }
                        onReleaseClick={handleReleaseClick}
                        onPlayTrack={handlePlayTrack}
                      />
                    ))}
                  </ul>
                </>
              ) : (
                <p className={styles.text}>This playlist is empty.</p>
              )}
            </div>
          </section>

          <section className={classNames(styles.section, styles.aboutSection)}>
            <div className={styles.twoColumnLayout}>
              <div className={styles.aboutContent}>
                <h2 className={styles.heading}>About FilterMyDiscogs</h2>
                <p className={styles.text}>{SITE_LEAD}</p>
                <p className={styles.text}>Key features:</p>
                <PublicMarketingFeatureList
                  bullets={PUBLIC_PLAYLIST_MARKETING_BULLETS}
                />
                <p className={styles.text}>
                  <Link href="/about" className={styles.inlineLink}>
                    Learn more
                  </Link>
                </p>
              </div>

              <div className={styles.loginModule}>
                <h2 className={styles.heading}>Get Started</h2>
                <p className={styles.text}>
                  Connect your Discogs account to start exploring and organizing
                  your collection.
                </p>
                <div className={styles.loginButtonContainer}>
                  <LoginConnectButton
                    onClick={login}
                    className={styles.connectButton}
                  />
                </div>
                <p className={styles.loginNote}>
                  <Link href="/legal" className={styles.inlineLink}>
                    Terms & Privacy
                  </Link>
                </p>
              </div>
            </div>
          </section>

          <PlaybackScrollSpacer />
        </div>
      </div>
      <PublicReleaseModal
        isOpen={selectedRelease !== null}
        release={selectedRelease}
        onClose={handleCloseModal}
      />
    </>
  );
};

export const PublicPlaylistPage = ({
  playlistId,
  initialPublicPlaylist,
}: PublicPlaylistClientProps) => (
  <main
    data-testid="fmdPublicPlaylist"
    aria-label={PUBLIC_SHARED_PLAYLIST_MAIN_LABEL}
  >
    <PublicSharePlaybackShell>
      <PublicPlaylistClient
        playlistId={playlistId}
        {...(initialPublicPlaylist !== undefined
          ? { initialPublicPlaylist }
          : {})}
      />
    </PublicSharePlaybackShell>
  </main>
);
