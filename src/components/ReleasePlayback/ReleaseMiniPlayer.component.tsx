"use client";

import classNames from "classnames";
import Image from "next/image";
import { useCallback } from "react";
import { useCrate } from "src/context/crate.context";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import ChevronRightIcon from "src/styles/icons/chevron-right-solid.svg";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import PauseIcon from "src/styles/icons/pause-solid.svg";
import PlayIcon from "src/styles/icons/play-solid.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import XIcon from "src/styles/icons/x.svg";
import { getReleaseImageUrl } from "src/utils/helpers";
import { formatArtistNames } from "src/utils/releaseDisplay";
import { PersistentYoutubeIframe } from "./PersistentYoutubeIframe.component";
import styles from "./ReleaseMiniPlayer.module.css";

interface ReleaseMiniPlayerProps {
  onReleaseClick?: (instanceId: string) => void;
}

export const ReleaseMiniPlayer = ({
  onReleaseClick,
}: ReleaseMiniPlayerProps) => {
  const {
    release,
    activeTrack,
    activeVideoId,
    isPlaying,
    isPaused,
    isPlaybackReady,
    shouldAutoplayEmbed,
    canPlayPrevious,
    canPlayNext,
    isLoading,
    playNext,
    playPrevious,
    togglePlayback,
    stopPlayback,
  } = useReleasePlayback();
  const { addToCrate, removeFromCrate, isInCrate } = useCrate();

  const inCrate = isInCrate(release?.instance_id ?? "");

  const handleCrateToggle = useCallback(() => {
    if (!release) {
      return;
    }

    if (inCrate) {
      removeFromCrate(release.instance_id);
      return;
    }

    addToCrate(release);
  }, [addToCrate, inCrate, release, removeFromCrate]);

  if (!(isPlaying && release)) {
    return null;
  }

  const artistNames = formatArtistNames(release);
  const thumbUrl = getReleaseImageUrl({
    thumb: release.basic_information.thumb,
    cover_image: release.basic_information.cover_image,
    width: 120,
    height: 120,
    preferCoverImage: true,
  });

  const hasPrevious = canPlayPrevious;
  const hasNext = canPlayNext;

  const handleOpenRelease = () => {
    if (!onReleaseClick) {
      return;
    }

    onReleaseClick(String(release.instance_id));
  };

  const cover = thumbUrl ? (
    <Image
      src={thumbUrl}
      alt=""
      width={40}
      height={40}
      className={styles.cover}
      sizes="40px"
    />
  ) : null;

  const metaLines =
    isLoading || !activeTrack ? (
      <p className={styles.trackTitle}>Loading playback…</p>
    ) : (
      <>
        <p className={styles.artist}>{artistNames}</p>
        <p className={styles.trackTitle}>{activeTrack.title}</p>
      </>
    );

  const releaseMeta = <div className={styles.metaLines}>{metaLines}</div>;

  return (
    <>
      {isPlaybackReady && activeTrack && activeVideoId ? (
        <PersistentYoutubeIframe
          videoId={activeVideoId}
          videoTitle={activeTrack.title}
          playbackKey={`${activeTrack.position}-${activeVideoId}`}
          autoplay={shouldAutoplayEmbed}
        />
      ) : null}
      <section
        className={styles.miniPlayer}
        data-testid="fmdReleaseMiniPlayer"
        aria-label="Now playing"
      >
        <div className={styles.releaseArea}>
          <div className={styles.metaRow}>
            {onReleaseClick ? (
              <button
                type="button"
                className={styles.openReleaseButton}
                onClick={handleOpenRelease}
                aria-label={`Open ${release.basic_information.title}`}
              >
                {cover}
                {releaseMeta}
              </button>
            ) : (
              <>
                {cover}
                {releaseMeta}
              </>
            )}
            <button
              type="button"
              className={classNames(styles.crateButton, {
                [styles.crateButtonActive]: inCrate,
              })}
              onClick={handleCrateToggle}
              aria-label={inCrate ? "Remove from crate" : "Add to crate"}
            >
              {inCrate ? (
                <MinusIcon className={styles.crateIcon} aria-hidden />
              ) : (
                <PlusIcon className={styles.crateIcon} aria-hidden />
              )}
            </button>
          </div>
        </div>
        <div className={styles.controls}>
          <button
            type="button"
            className={classNames(styles.controlButton, styles.previousButton)}
            onClick={playPrevious}
            disabled={!hasPrevious}
            aria-label="Previous track"
          >
            <ChevronRightIcon className={styles.previousIcon} aria-hidden />
          </button>
          <button
            type="button"
            className={styles.controlButton}
            onClick={togglePlayback}
            disabled={!isPlaybackReady}
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? (
              <PlayIcon className={styles.playPauseIcon} aria-hidden />
            ) : (
              <PauseIcon className={styles.playPauseIcon} aria-hidden />
            )}
          </button>
          <button
            type="button"
            className={styles.controlButton}
            onClick={playNext}
            disabled={!hasNext}
            aria-label="Next track"
          >
            <ChevronRightIcon className={styles.nextIcon} aria-hidden />
          </button>
          <button
            type="button"
            className={styles.controlButton}
            onClick={stopPlayback}
            aria-label="Stop playback"
          >
            <XIcon className={styles.closeIcon} aria-hidden />
          </button>
        </div>
      </section>
    </>
  );
};
