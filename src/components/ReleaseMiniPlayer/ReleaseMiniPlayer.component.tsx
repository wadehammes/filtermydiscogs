"use client";

import classNames from "classnames";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { trackPlaybackVideoOpened } from "src/analytics/productAnalyticsEvents";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { OverlayStack } from "src/components/OverlayStack/OverlayStack.component";
import { PersistentYoutubeIframe } from "src/components/PersistentYoutubeIframe/PersistentYoutubeIframe.component";
import { PlaybackQueueDrawerLazy } from "src/components/PlaybackQueueDrawer/PlaybackQueueDrawerLazy.component";
import { ReleaseCrateMenu } from "src/components/ReleaseCard/ReleaseCrateMenu.component";
import { ReleasePlaybackVideoPanel } from "src/components/ReleasePlaybackVideoPanel/ReleasePlaybackVideoPanel.component";
import {
  TransportSkipNextIcon,
  TransportSkipPreviousIcon,
} from "src/components/TransportSkipIcons/TransportSkipIcons.component";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { useCrateDrawerOpen } from "src/hooks/useCrateDrawerOpen.hook";
import { useFiltersDrawerOpen } from "src/hooks/useFiltersDrawerOpen.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { ListThinIcon } from "src/styles/icons/ListThinIcon.component";
import PauseIcon from "src/styles/icons/pause-thin.svg";
import PlayIcon from "src/styles/icons/play-thin.svg";
import VideoIcon from "src/styles/icons/video-thin.svg";
import { getReleaseImageUrl } from "src/utils/helpers";
import {
  hasSeenPlaybackVideoIntro,
  markPlaybackVideoIntroSeen,
} from "src/utils/playbackVideoIntroStorage";
import { formatArtistNames } from "src/utils/releaseDisplay";
import styles from "./ReleaseMiniPlayer.module.css";
import { ReleaseMiniPlayerMarquee } from "./ReleaseMiniPlayerMarquee.component";

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
    playbackVideoId,
    isPaused,
    isPlaying,
    isPlaybackReady,
    shouldAutoplayEmbed,
    isPlaybackEmbedMounted,
    canPlayPrevious,
    canPlayNext,
    isLoading,
    isMiniPlayerVisible,
    playNext,
    playPrevious,
    togglePlayback,
    queue,
  } = useReleasePlayback();
  const isMobileLayout = useMediaQuery("(max-width: 768px)");
  const filtersDrawerOpen = useFiltersDrawerOpen();
  const crateDrawerOpen = useCrateDrawerOpen();
  const [videoPanelOverride, setVideoPanelOverride] = useState<
    null | "open" | "closed"
  >(null);
  const [latchedIntroExpand, setLatchedIntroExpand] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const iframeVideoId = playbackVideoId;

  useEffect(() => {
    if (isMiniPlayerVisible) {
      return;
    }

    setVideoPanelOverride(null);
    setLatchedIntroExpand(false);
    setIsQueueOpen(false);
  }, [isMiniPlayerVisible]);

  useEffect(() => {
    if (filtersDrawerOpen || crateDrawerOpen) {
      setVideoPanelOverride("closed");
    }
  }, [crateDrawerOpen, filtersDrawerOpen]);

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
    width: 64,
    height: 64,
    preferCoverImage: true,
  });

  const hasPrevious = canPlayPrevious;
  const hasNext = canPlayNext;
  const shouldAutoplayIframe = shouldAutoplayEmbed && !isPlaybackEmbedMounted;

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
      width={28}
      height={28}
      className={styles.cover}
      sizes="28px"
    />
  ) : null;

  const metaLines =
    isLoading || !activePlaybackTitle ? (
      <p className={styles.loadingLabel}>Loading playback…</p>
    ) : (
      <ReleaseMiniPlayerMarquee className={styles.metaMarquee}>
        <span className={styles.marqueeArtist}>{artistNames}</span>
        <span className={styles.marqueeSeparator} aria-hidden>
          {" · "}
        </span>
        <span className={styles.marqueeTitle}>{activePlaybackTitle}</span>
      </ReleaseMiniPlayerMarquee>
    );

  const crateToggleButton = (
    <ReleaseCrateMenu
      release={release}
      triggerVariant="custom"
      actionClass={(active) =>
        classNames(styles.controlButton, styles.crateButton, {
          [styles.crateButtonActive]: active,
        })
      }
      slotClass={styles.crateButton}
    />
  );

  return (
    <div className={styles.miniPlayerRoot}>
      <OverlayStack
        escapeStackingContext
        popoverZIndex="calc(var(--z-9-playback-dock) + 1)"
      >
        {isQueueOpen ? (
          <PlaybackQueueDrawerLazy
            isOpen={isQueueOpen}
            onClose={() => {
              setIsQueueOpen(false);
            }}
          />
        ) : null}
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
                key={String(release.instance_id)}
                videoId={iframeVideoId}
                videoTitle={activePlaybackTitle ?? "Release preview"}
                playbackKey={`${release.instance_id}-${activeTrack?.position ?? "preview"}-${iframeVideoId}`}
                autoplay={shouldAutoplayIframe}
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
              <IconButton
                variant="queue"
                className={classNames(
                  styles.controlButton,
                  styles.queueButton,
                  {
                    [styles.queueButtonActive]: isQueueOpen,
                  },
                )}
                iconClassName={styles.controlIcon}
                addon={
                  queue.length > 0 ? (
                    <span className={styles.queueCount}>{queue.length}</span>
                  ) : undefined
                }
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
                <ListThinIcon />
              </IconButton>
              {isPlaybackReady ? (
                <IconButton
                  className={classNames(styles.controlButton, {
                    [styles.videoButtonActive]: isVideoPanelExpanded,
                  })}
                  iconClassName={styles.controlIcon}
                  onClick={handleVideoToggle}
                  aria-expanded={isVideoPanelExpanded}
                  aria-controls="release-playback-video-panel"
                  aria-label={
                    isVideoPanelExpanded ? "Hide video" : "Show video"
                  }
                  title={isVideoPanelExpanded ? "Hide video" : "Show video"}
                >
                  <VideoIcon />
                </IconButton>
              ) : null}
              <IconButton
                className={styles.controlButton}
                iconClassName={styles.controlIcon}
                onClick={playPrevious}
                disabled={!hasPrevious}
                aria-label="Previous track"
                title="Previous track"
              >
                <TransportSkipPreviousIcon />
              </IconButton>
              <IconButton
                className={styles.controlButton}
                iconClassName={styles.controlIcon}
                onClick={togglePlayback}
                disabled={!isPlaybackReady}
                aria-label={isPaused ? "Play" : "Pause"}
                title={isPaused ? "Play" : "Pause"}
              >
                {isPaused ? <PlayIcon /> : <PauseIcon />}
              </IconButton>
              <IconButton
                className={styles.controlButton}
                iconClassName={styles.controlIcon}
                onClick={playNext}
                disabled={!hasNext}
                aria-label="Next track"
                title="Next track"
              >
                <TransportSkipNextIcon />
              </IconButton>
            </div>
          </div>
        </section>
      </OverlayStack>
    </div>
  );
};
