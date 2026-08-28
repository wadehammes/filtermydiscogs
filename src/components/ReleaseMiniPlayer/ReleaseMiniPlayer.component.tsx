"use client";

import classNames from "classnames";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { trackPlaybackVideoOpened } from "src/analytics/productAnalyticsEvents";
import { PersistentYoutubeIframe } from "src/components/PersistentYoutubeIframe/PersistentYoutubeIframe.component";
import { PlaybackQueueDrawer } from "src/components/PlaybackQueueDrawer/PlaybackQueueDrawer.component";
import { ReleasePlaybackVideoPanel } from "src/components/ReleasePlaybackVideoPanel/ReleasePlaybackVideoPanel.component";
import {
  TransportSkipNextIcon,
  TransportSkipPreviousIcon,
} from "src/components/TransportSkipIcons/TransportSkipIcons.component";
import { useCrate } from "src/context/crate.context";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { useFiltersDrawerOpen } from "src/hooks/useFiltersDrawerOpen.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { ListThinIcon } from "src/styles/icons/ListThinIcon.component";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import PauseIcon from "src/styles/icons/pause-thin.svg";
import PlayIcon from "src/styles/icons/play-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import VideoIcon from "src/styles/icons/video-thin.svg";
import { getReleaseImageUrl } from "src/utils/helpers";
import {
  hasSeenPlaybackVideoIntro,
  markPlaybackVideoIntroSeen,
} from "src/utils/playbackVideoIntroStorage";
import { formatArtistNames } from "src/utils/releaseDisplay";
import styles from "./ReleaseMiniPlayer.module.css";

interface ReleaseMiniPlayerProps {
  onReleaseClick?: (instanceId: string) => void;
}

export const ReleaseMiniPlayer = ({
  onReleaseClick,
}: ReleaseMiniPlayerProps) => {
  "use memo";
  const {
    release,
    activeTrack,
    activePlaybackTitle,
    activeVideoId,
    embedVideoId,
    isPaused,
    isPlaying,
    isPlaybackReady,
    shouldAutoplayEmbed,
    canPlayPrevious,
    canPlayNext,
    isLoading,
    isMiniPlayerVisible,
    playNext,
    playPrevious,
    togglePlayback,
    queue,
  } = useReleasePlayback();
  const { addToCrate, removeFromCrate, isInCrate } = useCrate();
  const isMobileLayout = useMediaQuery("(max-width: 768px)");
  const filtersDrawerOpen = useFiltersDrawerOpen();
  const [videoPanelOverride, setVideoPanelOverride] = useState<
    null | "open" | "closed"
  >(null);
  const [latchedIntroExpand, setLatchedIntroExpand] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const iframeVideoId = embedVideoId ?? activeVideoId;

  const inCrate = isInCrate(release?.instance_id ?? "");

  useEffect(() => {
    if (isMiniPlayerVisible) {
      return;
    }

    setVideoPanelOverride(null);
    setLatchedIntroExpand(false);
    setIsQueueOpen(false);
  }, [isMiniPlayerVisible]);

  useEffect(() => {
    if (filtersDrawerOpen) {
      setVideoPanelOverride("closed");
    }
  }, [filtersDrawerOpen]);

  const shouldExpandForAutoplay = isPlaybackReady && shouldAutoplayEmbed;

  useEffect(() => {
    if (!(isPlaybackReady && !hasSeenPlaybackVideoIntro())) {
      return;
    }

    setLatchedIntroExpand(true);
    markPlaybackVideoIntroSeen();
  }, [isPlaybackReady]);

  const isVideoPanelExpanded =
    videoPanelOverride === "open" ||
    (videoPanelOverride !== "closed" &&
      (shouldExpandForAutoplay || latchedIntroExpand));

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

  const handleVideoToggle = useCallback(() => {
    markPlaybackVideoIntroSeen();
    if (!isVideoPanelExpanded) {
      trackPlaybackVideoOpened();
    }
    setVideoPanelOverride(isVideoPanelExpanded ? "closed" : "open");
  }, [isVideoPanelExpanded]);

  if (!(isMiniPlayerVisible && release)) {
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
    isLoading || !activePlaybackTitle ? (
      <p className={styles.trackTitle}>Loading playback…</p>
    ) : (
      <>
        <p className={styles.artist}>{artistNames}</p>
        <p className={styles.trackTitle}>{activePlaybackTitle}</p>
      </>
    );

  const crateToggleButton = (
    <button
      type="button"
      className={classNames(styles.controlButton, styles.crateButton, {
        [styles.crateButtonActive]: inCrate,
      })}
      onClick={handleCrateToggle}
      aria-label={inCrate ? "Remove from crate" : "Add to crate"}
      title={inCrate ? "Remove from Crate" : "Add to Crate"}
    >
      {inCrate ? (
        <MinusIcon className={styles.controlIcon} aria-hidden />
      ) : (
        <PlusIcon className={styles.controlIcon} aria-hidden />
      )}
    </button>
  );

  return (
    <div className={styles.miniPlayerRoot}>
      <PlaybackQueueDrawer
        isOpen={isQueueOpen}
        onClose={() => {
          setIsQueueOpen(false);
        }}
      />
      <section
        className={styles.miniPlayerShell}
        data-testid="fmdReleaseMiniPlayer"
        {...(isVideoPanelExpanded && { "data-video-expanded": true })}
        aria-label="Now playing"
      >
        {isPlaying && iframeVideoId ? (
          <ReleasePlaybackVideoPanel
            panelId="release-playback-video-panel"
            isExpanded={isVideoPanelExpanded}
            onClose={handleVideoToggle}
          >
            <PersistentYoutubeIframe
              videoId={iframeVideoId}
              videoTitle={activePlaybackTitle ?? "Release preview"}
              playbackKey={`${release.instance_id}-${activeTrack?.position ?? "preview"}-${iframeVideoId}`}
              autoplay={shouldAutoplayEmbed}
              variant={isVideoPanelExpanded ? "visible" : "hidden"}
            />
          </ReleasePlaybackVideoPanel>
        ) : null}
        <div className={styles.miniPlayerBar}>
          <div className={styles.releaseArea}>
            <div className={styles.metaRow}>
              {!isMobileLayout ? crateToggleButton : null}
              {onReleaseClick ? (
                <button
                  type="button"
                  className={styles.openReleaseButton}
                  onClick={handleOpenRelease}
                  aria-label={`Open ${release.basic_information.title}`}
                  title="Open release details"
                >
                  {cover}
                  <div className={styles.metaLines}>{metaLines}</div>
                </button>
              ) : (
                <div className={styles.releaseInfo}>
                  {cover}
                  <div className={styles.metaLines}>{metaLines}</div>
                </div>
              )}
            </div>
          </div>
          <div className={styles.controls}>
            {isMobileLayout ? crateToggleButton : null}
            <button
              type="button"
              className={classNames(styles.controlButton, styles.queueButton, {
                [styles.queueButtonActive]: isQueueOpen,
              })}
              onClick={() => {
                setIsQueueOpen((open) => !open);
              }}
              aria-expanded={isQueueOpen}
              aria-label={
                queue.length > 0
                  ? `Open playback queue, ${queue.length} tracks`
                  : "Open playback queue"
              }
              title="Playback queue"
            >
              <ListThinIcon className={styles.controlIcon} aria-hidden />
              {queue.length > 0 ? (
                <span className={styles.queueCount}>{queue.length}</span>
              ) : null}
            </button>
            {isPlaybackReady ? (
              <button
                type="button"
                className={classNames(styles.controlButton, {
                  [styles.videoButtonActive]: isVideoPanelExpanded,
                })}
                onClick={handleVideoToggle}
                aria-expanded={isVideoPanelExpanded}
                aria-controls="release-playback-video-panel"
                aria-label={isVideoPanelExpanded ? "Hide video" : "Show video"}
                title={isVideoPanelExpanded ? "Hide video" : "Show video"}
              >
                <VideoIcon className={styles.controlIcon} aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              className={styles.controlButton}
              onClick={playPrevious}
              disabled={!hasPrevious}
              aria-label="Previous track"
              title="Previous track"
            >
              <TransportSkipPreviousIcon className={styles.controlIcon} />
            </button>
            <button
              type="button"
              className={styles.controlButton}
              onClick={togglePlayback}
              disabled={!isPlaybackReady}
              aria-label={isPaused ? "Play" : "Pause"}
              title={isPaused ? "Play" : "Pause"}
            >
              {isPaused ? (
                <PlayIcon className={styles.controlIcon} aria-hidden />
              ) : (
                <PauseIcon className={styles.controlIcon} aria-hidden />
              )}
            </button>
            <button
              type="button"
              className={styles.controlButton}
              onClick={playNext}
              disabled={!hasNext}
              aria-label="Next track"
              title="Next track"
            >
              <TransportSkipNextIcon className={styles.controlIcon} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
