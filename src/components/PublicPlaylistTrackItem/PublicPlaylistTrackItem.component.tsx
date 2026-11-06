"use client";

import classNames from "classnames";
import Image from "next/image";
import { PlayingIndicator } from "src/components/PlayingIndicator/PlayingIndicator.component";
import { PublicPlaylistTrackVoteControls } from "src/components/PublicPlaylistTrackVoteControls/PublicPlaylistTrackVoteControls.component";
import tracklistStyles from "src/components/ReleaseTracklist/ReleaseTracklist.module.css";
import {
  REPORT_WRONG_PUBLIC_PLAYBACK_VIDEO_ARIA_LABEL,
  REPORT_WRONG_PUBLIC_PLAYBACK_VIDEO_BUTTON_LABEL,
} from "src/constants/accessibilityLabels.constants";
import {
  useReleasePlaybackActions,
  useReleasePlaybackState,
} from "src/context/releasePlayback.context";
import { useReleaseCardOpenHandler } from "src/hooks/useReleaseCardOpenHandler.hook";
import PauseIcon from "src/styles/icons/pause-thin.svg";
import PlayIcon from "src/styles/icons/play-thin.svg";
import textActionStyles from "src/styles/modules/text-action.module.css";
import type { DiscogsRelease } from "src/types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import { buildPublicPlaybackVideoReportEntry } from "src/utils/buildPublicPlaybackVideoReportEntry";
import { definedProps } from "src/utils/definedProps";
import { openPlaybackSkipReportDialog } from "src/utils/playbackSkipUserReportDialogBridge";
import { isPlaylistTrackActiveInPlayback } from "src/utils/playlistPlayback";
import { resolvePlaylistTrackReleaseMetaLine } from "src/utils/playlistTrackDisplay";
import { resolveReleaseDisplayImageUrl } from "src/utils/releaseAlbumCover";
import { formatTrackPositionTitle } from "src/utils/userTrack";
import styles from "./PublicPlaylistTrackItem.module.css";

export interface PublicPlaylistTrackItemProps {
  playlistId: string;
  track: PlaylistTrackRow;
  release: DiscogsRelease | null;
  index: number;
  ownerUserId?: number | null;
  showTrackVoteControls?: boolean;
  onReleaseClick?: (instanceId: string) => void;
  onPlayTrack: (track: PlaylistTrackRow) => void;
}

export const PublicPlaylistTrackItem = ({
  playlistId,
  track,
  release,
  index,
  ownerUserId,
  showTrackVoteControls = true,
  onReleaseClick,
  onPlayTrack,
}: PublicPlaylistTrackItemProps) => {
  const playbackState = useReleasePlaybackState();
  const { togglePlayback } = useReleasePlaybackActions();
  const isActiveInPlayback =
    playbackState.isMiniPlayerVisible &&
    isPlaylistTrackActiveInPlayback(track, playbackState);
  const isPlaybackPaused = playbackState.isPaused || !playbackState.isPlaying;
  const { openRelease, prefetchReleaseOpen, prefetchPointerProps, canOpen } =
    useReleaseCardOpenHandler({
      release,
      onReleaseClick,
    });

  const imageUrl = release
    ? resolveReleaseDisplayImageUrl(release) || null
    : null;

  const trackLabel = formatTrackPositionTitle(
    track.track_position,
    track.track_title,
  );
  const metaLine = resolvePlaylistTrackReleaseMetaLine(track, release);

  const handlePlay = () => {
    onPlayTrack(track);
  };

  const handlePlaybackControl = () => {
    if (isActiveInPlayback) {
      togglePlayback();
      return;
    }

    onPlayTrack(track);
  };

  const handleReportWrongVideo = () => {
    openPlaybackSkipReportDialog(
      buildPublicPlaybackVideoReportEntry(playlistId, track, release),
    );
  };

  let playbackControlLabel = `Play ${trackLabel}`;

  if (isActiveInPlayback) {
    playbackControlLabel = isPlaybackPaused
      ? `Resume ${trackLabel}`
      : `Pause ${trackLabel}`;
  }

  return (
    <li
      className={classNames(tracklistStyles.trackItem, {
        [tracklistStyles.trackItemActive]: isActiveInPlayback,
      })}
      data-testid="fmdPublicPlaylistTrackItem"
      {...(isActiveInPlayback ? { "data-playlist-track-active": "" } : {})}
      {...definedProps(prefetchPointerProps ?? {})}
    >
      <div className={styles.trackRow}>
        <span
          className={classNames(
            tracklistStyles.trackPosition,
            styles.indexCell,
          )}
        >
          {index}
        </span>
        <button
          type="button"
          className={styles.artworkButton}
          onClick={openRelease}
          disabled={!canOpen}
          aria-label={
            release
              ? `Open ${release.basic_information.title}`
              : "Release unavailable"
          }
          {...definedProps(canOpen ? { onFocus: prefetchReleaseOpen } : {})}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              height={56}
              width={56}
              quality={100}
              alt=""
              className={styles.artworkImage}
              loading="lazy"
              sizes="56px"
            />
          ) : (
            <span className={styles.artworkPlaceholder} aria-hidden />
          )}
        </button>
        <button
          type="button"
          className={classNames(
            tracklistStyles.trackMainButton,
            styles.trackPlayButton,
          )}
          onClick={handlePlay}
          aria-label={
            isActiveInPlayback
              ? `Now playing ${trackLabel}`
              : `Play ${trackLabel}`
          }
          aria-current={isActiveInPlayback ? "true" : undefined}
        >
          <span
            className={classNames(
              tracklistStyles.trackTitleStack,
              styles.trackTitleLayout,
            )}
          >
            <span
              className={classNames(
                tracklistStyles.trackTitleText,
                styles.trackTitlePrimary,
              )}
            >
              {trackLabel}
            </span>
            {track.artist || metaLine ? (
              <span className={styles.trackMetaGroup}>
                {track.artist ? (
                  <span className={tracklistStyles.trackCredits}>
                    {track.artist}
                  </span>
                ) : null}
                {metaLine ? (
                  <span className={tracklistStyles.trackCredits}>
                    {metaLine}
                  </span>
                ) : null}
              </span>
            ) : null}
          </span>
        </button>
        <div className={tracklistStyles.trackTrailing}>
          <div className={styles.trailingActions}>
            {showTrackVoteControls ? (
              <PublicPlaylistTrackVoteControls
                playlistId={playlistId}
                track={track}
                {...definedProps({ ownerUserId })}
              />
            ) : null}
            {track.youtube_id ? (
              <button
                type="button"
                className={classNames(
                  textActionStyles.muted,
                  styles.reportWrongVideoButton,
                )}
                onClick={handleReportWrongVideo}
                aria-label={REPORT_WRONG_PUBLIC_PLAYBACK_VIDEO_ARIA_LABEL}
                data-testid="fmdPublicPlaylistTrackReportWrongVideo"
              >
                {REPORT_WRONG_PUBLIC_PLAYBACK_VIDEO_BUTTON_LABEL}
              </button>
            ) : null}
            <button
              type="button"
              className={styles.playbackControlButton}
              onClick={handlePlaybackControl}
              aria-label={playbackControlLabel}
              data-testid="fmdPublicPlaylistTrackPlaybackControl"
            >
              {isActiveInPlayback ? (
                isPlaybackPaused ? (
                  <PauseIcon aria-hidden />
                ) : (
                  <PlayingIndicator isPaused={false} />
                )
              ) : (
                <PlayIcon aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};
