"use client";

import classNames from "classnames";
import Image from "next/image";
import { Activity, type ReactNode, useEffect, useState } from "react";
import { OverlayStack } from "src/components/OverlayStack/OverlayStack.component";
import { PersistentYoutubeIframe } from "src/components/PersistentYoutubeIframe/PersistentYoutubeIframe.component";
import { PlaybackQueueDrawerLazy } from "src/components/PlaybackQueueDrawer/PlaybackQueueDrawerLazy.component";
import { ReleaseCrateMenu } from "src/components/ReleaseCard/ReleaseCrateMenu.component";
import { ReleasePlaybackVideoPanel } from "src/components/ReleasePlaybackVideoPanel/ReleasePlaybackVideoPanel.component";
import { Spinner } from "src/components/Spinner/Spinner.component";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { useCrateDrawerOpen } from "src/hooks/useCrateDrawerOpen.hook";
import { useFiltersDrawerOpen } from "src/hooks/useFiltersDrawerOpen.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { useReleaseCardOpenHandler } from "src/hooks/useReleaseCardOpenHandler.hook";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl } from "src/utils/helpers";
import { formatArtistNames } from "src/utils/releaseDisplay";
import styles from "./ReleaseMiniPlayer.module.css";
import { ReleaseMiniPlayerMarquee } from "./ReleaseMiniPlayerMarquee.component";
import { ReleaseMiniPlayerTransportControls } from "./ReleaseMiniPlayerTransportControls.component";
import { useReleaseMiniPlayerVideoPanelState } from "./useReleaseMiniPlayerVideoPanelState.hook";

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
    isQueueBuilding,
    isMiniPlayerVisible,
    playNext,
    playPrevious,
    togglePlayback,
    queue,
  } = useReleasePlayback();
  const isMobileLayout = useMediaQuery("(max-width: 768px)");
  const filtersDrawerOpen = useFiltersDrawerOpen();
  const crateDrawerOpen = useCrateDrawerOpen();
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const { openRelease, prefetchPointerProps } = useReleaseCardOpenHandler({
    release,
    onReleaseClick,
  });

  const { isVideoPanelExpanded, handleVideoToggle } =
    useReleaseMiniPlayerVideoPanelState({
      isMiniPlayerVisible,
      isPlaybackReady,
      shouldAutoplayEmbed,
      filtersDrawerOpen,
      crateDrawerOpen,
    });

  const iframeVideoId = playbackVideoId;

  useEffect(() => {
    if (isMiniPlayerVisible) {
      return;
    }

    setIsQueueOpen(false);
  }, [isMiniPlayerVisible]);

  if (!(isMiniPlayerVisible && release)) {
    return null;
  }

  let queueButtonAriaLabel = "Open playback queue";

  if (isQueueBuilding) {
    queueButtonAriaLabel = "Open playback queue, building";
  } else if (queue.length > 0) {
    queueButtonAriaLabel = `Open playback queue, ${queue.length} tracks`;
  }

  let queueButtonAddon: ReactNode;

  if (isQueueBuilding) {
    queueButtonAddon = (
      <span className={styles.queueCount}>
        <Spinner
          size="xs"
          className={styles.queueCountSpinner}
          aria-label="Building playback queue"
        />
      </span>
    );
  } else if (queue.length > 0) {
    queueButtonAddon = (
      <span className={styles.queueCount}>{queue.length}</span>
    );
  }

  const artistNames = formatArtistNames(release);
  const thumbUrl = getReleaseImageUrl({
    thumb: release.basic_information.thumb,
    cover_image: release.basic_information.cover_image,
    width: 64,
    height: 64,
    preferCoverImage: true,
  });

  const shouldAutoplayIframe = shouldAutoplayEmbed && !isPlaybackEmbedMounted;

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
        <section
          className={styles.miniPlayerShell}
          data-testid="fmdReleaseMiniPlayer"
          {...(isVideoPanelExpanded && { "data-video-expanded": true })}
          {...(isQueueOpen && { "data-playback-queue-shell-open": true })}
          {...(isQueueOpen &&
            isVideoPanelExpanded && { "data-queue-over-video": true })}
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
          <Activity mode={isQueueOpen ? "visible" : "hidden"}>
            <PlaybackQueueDrawerLazy
              isOpen={isQueueOpen}
              elevateOverVideo={isVideoPanelExpanded}
              onClose={() => {
                setIsQueueOpen(false);
              }}
            />
          </Activity>
          <div className={styles.miniPlayerBar}>
            <div className={styles.releaseArea}>
              <div className={styles.metaRow}>
                {!isMobileLayout ? crateToggleButton : null}
                {onReleaseClick ? (
                  <button
                    type="button"
                    className={styles.openReleaseButton}
                    onClick={openRelease}
                    aria-label={`Open ${release.basic_information.title}`}
                    title="Open release details"
                    {...definedProps(prefetchPointerProps ?? {})}
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
            <ReleaseMiniPlayerTransportControls
              isMobileLayout={isMobileLayout}
              crateToggleButton={crateToggleButton}
              isQueueOpen={isQueueOpen}
              queueButtonAriaLabel={queueButtonAriaLabel}
              {...(queueButtonAddon !== undefined ? { queueButtonAddon } : {})}
              onQueueToggle={() => {
                setIsQueueOpen((open) => !open);
              }}
              isPlaybackReady={isPlaybackReady}
              isVideoPanelExpanded={isVideoPanelExpanded}
              onVideoToggle={handleVideoToggle}
              hasPrevious={canPlayPrevious}
              hasNext={canPlayNext}
              isPaused={isPaused}
              onPlayPrevious={playPrevious}
              onTogglePlayback={togglePlayback}
              onPlayNext={playNext}
            />
          </div>
        </section>
      </OverlayStack>
    </div>
  );
};
