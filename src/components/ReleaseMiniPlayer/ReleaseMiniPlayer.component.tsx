"use client";

import classNames from "classnames";
import Image from "next/image";
import { Activity, useCallback, useEffect, useState } from "react";
import { OverlayStack } from "src/components/OverlayStack/OverlayStack.component";
import { PersistentYoutubeIframe } from "src/components/PersistentYoutubeIframe/PersistentYoutubeIframe.component";
import { PlaybackQueueDrawerLazy } from "src/components/PlaybackQueueDrawer/PlaybackQueueDrawerLazy.component";
import { ReleaseMiniPlayerAddToMenu } from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayerAddToMenu.component";
import { ReleaseMiniPlayerDigScrub } from "src/components/ReleaseMiniPlayerDigControls/ReleaseMiniPlayerDigScrub.component";
import { ReleaseMiniPlayerVolumePopover } from "src/components/ReleaseMiniPlayerDigControls/ReleaseMiniPlayerVolumePopover.component";
import { ReleasePlaybackVideoPanel } from "src/components/ReleasePlaybackVideoPanel/ReleasePlaybackVideoPanel.component";
import { Spinner } from "src/components/Spinner/Spinner.component";
import { NOW_PLAYING_REGION_LABEL } from "src/constants/accessibilityLabels.constants";
import { COMPACT_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useAuth } from "src/context/auth.context";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { useCrateDrawerOpen } from "src/hooks/useCrateDrawerOpen.hook";
import { useFiltersDrawerOpen } from "src/hooks/useFiltersDrawerOpen.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { usePlaybackDockMobileBarCollapsed } from "src/hooks/usePlaybackDockMobileBarCollapsed.hook";
import { usePlaybackDockMobileScrollPassthrough } from "src/hooks/usePlaybackDockMobileScrollPassthrough.hook";
import { useReleaseCardOpenHandler } from "src/hooks/useReleaseCardOpenHandler.hook";
import { buildUserTrackMetadataBody } from "src/utils/buildUserTrackMetadataBody";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl } from "src/utils/helpers";
import { formatArtistNames } from "src/utils/releaseDisplay";
import { buildReleaseMiniPlayerQueueButton } from "./buildReleaseMiniPlayerQueueButton";
import styles from "./ReleaseMiniPlayer.module.css";
import { ReleaseMiniPlayerMarquee } from "./ReleaseMiniPlayerMarquee.component";
import { ReleaseMiniPlayerReleaseMetaRow } from "./ReleaseMiniPlayerReleaseMetaRow.component";
import { ReleaseMiniPlayerTransportControls } from "./ReleaseMiniPlayerTransportControls.component";
import { useReleaseMiniPlayerVideoPanelState } from "./useReleaseMiniPlayerVideoPanelState.hook";

interface ReleaseMiniPlayerProps {
  onReleaseClick?: (instanceId: string) => void;
  submenuOpenOnHover?: boolean;
}

export const ReleaseMiniPlayer = ({
  onReleaseClick,
  submenuOpenOnHover,
}: ReleaseMiniPlayerProps) => {
  "use memo";
  const { state: authState } = useAuth();
  const {
    release,
    activeTrackPosition,
    activePlaybackTitle,
    activePlaybackArtist,
    isReleasePreview,
    playbackVideoId,
    embedVideoId,
    isPaused,
    isPlaying,
    isPlaybackReady,
    shouldAutoplayEmbed,
    isPlaybackEmbedMounted,
    playbackEmbedRemountNonce,
    canPlayPrevious,
    canPlayNext,
    isLoading,
    isQueueBuilding,
    isPlaybackVideoLoading,
    isMiniPlayerVisible,
    playNext,
    playPrevious,
    togglePlayback,
    queue,
    resumePlaybackFromGesture,
  } = useReleasePlayback();
  const isMobileLayout = useMediaQuery(COMPACT_LAYOUT_MEDIA_QUERY);
  const filtersDrawerOpen = useFiltersDrawerOpen();
  const crateDrawerOpen = useCrateDrawerOpen();
  const { isDockBarCollapsed } = usePlaybackDockMobileBarCollapsed({
    isMiniPlayerVisible,
  });
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const isDockBarExpanded = !isDockBarCollapsed;
  const isQueueDrawerOpen = isQueueOpen && isDockBarExpanded;
  const [dockScrollPassthroughNode, setDockScrollPassthroughNode] =
    useState<HTMLElement | null>(null);

  usePlaybackDockMobileScrollPassthrough({
    dockShellNode: dockScrollPassthroughNode,
    enabled: isMobileLayout && isDockBarExpanded,
  });
  const { openRelease: openReleaseBase, prefetchPointerProps } =
    useReleaseCardOpenHandler({
      release,
      onReleaseClick,
    });

  const openRelease = useCallback(() => {
    setIsQueueOpen(false);
    openReleaseBase();
  }, [openReleaseBase]);

  const { isVideoPanelExpanded, handleVideoToggle } =
    useReleaseMiniPlayerVideoPanelState({
      isMiniPlayerVisible,
      isPlaying,
      filtersDrawerOpen,
      crateDrawerOpen,
      resumePlaybackFromGesture,
    });

  const showVideoLoading = isPlaybackVideoLoading && isVideoPanelExpanded;

  useEffect(() => {
    if (isMiniPlayerVisible && isDockBarExpanded) {
      return;
    }

    setIsQueueOpen(false);
  }, [isDockBarExpanded, isMiniPlayerVisible]);

  if (!(isMiniPlayerVisible && release)) {
    return null;
  }

  const { ariaLabel: queueButtonAriaLabel, addon: queueButtonAddon } =
    buildReleaseMiniPlayerQueueButton({
      isQueueBuilding,
      queueLength: queue.length,
    });

  const artistNames =
    activePlaybackArtist?.trim() || formatArtistNames(release);
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

  const playlistMetadata =
    authState.userId &&
    !isReleasePreview &&
    activeTrackPosition &&
    activePlaybackTitle
      ? buildUserTrackMetadataBody({
          release,
          trackPosition: activeTrackPosition,
          trackTitle: activePlaybackTitle,
          artist: artistNames,
          releaseTitle: release.basic_information.title,
          ...definedProps({
            youtubeId: embedVideoId ?? playbackVideoId,
          }),
        })
      : undefined;

  const addToMenu = (
    <ReleaseMiniPlayerAddToMenu
      release={release}
      trackTitle={activePlaybackTitle ?? "Track"}
      {...definedProps({ playlistMetadata, submenuOpenOnHover })}
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
          ref={setDockScrollPassthroughNode}
          className={styles.miniPlayerShell}
          data-testid="fmdReleaseMiniPlayer"
          {...(isVideoPanelExpanded &&
            isDockBarExpanded && { "data-video-expanded": true })}
          {...(isQueueDrawerOpen && {
            "data-playback-queue-shell-open": true,
          })}
          {...(isQueueDrawerOpen &&
            isVideoPanelExpanded && { "data-queue-over-video": true })}
          {...(showVideoLoading && { "data-playback-video-loading": true })}
          {...(isDockBarCollapsed && {
            "data-playback-dock-bar-collapsed": true,
          })}
          aria-label={NOW_PLAYING_REGION_LABEL}
        >
          {isPlaying && playbackVideoId ? (
            <ReleasePlaybackVideoPanel
              panelId="release-playback-video-panel"
              isExpanded={isVideoPanelExpanded && isDockBarExpanded}
              onClose={handleVideoToggle}
            >
              <div
                className={classNames(styles.videoEmbedHost, {
                  [styles.videoEmbedHostLoading]: showVideoLoading,
                })}
              >
                {showVideoLoading ? (
                  <div
                    className={styles.videoLoadingOverlay}
                    role="status"
                    aria-label="Loading video"
                  >
                    <Spinner size="sm" aria-label="Loading video" aria-hidden />
                  </div>
                ) : null}
                <PersistentYoutubeIframe
                  key={`${String(release.instance_id)}-${playbackEmbedRemountNonce}`}
                  videoId={playbackVideoId}
                  videoTitle={activePlaybackTitle ?? "Release preview"}
                  autoplay={shouldAutoplayIframe}
                  deferVideoLoad={false}
                  isPlaybackVideoLoading={isPlaybackVideoLoading}
                  variant={
                    isVideoPanelExpanded && isDockBarExpanded
                      ? "visible"
                      : "hidden"
                  }
                />
              </div>
            </ReleasePlaybackVideoPanel>
          ) : null}
          <Activity mode={isQueueDrawerOpen ? "visible" : "hidden"}>
            <PlaybackQueueDrawerLazy
              isOpen={isQueueDrawerOpen}
              elevateOverVideo={isVideoPanelExpanded}
              onClose={() => {
                setIsQueueOpen(false);
              }}
            />
          </Activity>
          {isDockBarExpanded ? (
            <div className={styles.miniPlayerBar}>
              <div className={styles.releaseArea}>
                <div className={styles.metaRow}>
                  {!isMobileLayout ? addToMenu : null}
                  <ReleaseMiniPlayerReleaseMetaRow
                    {...definedProps({
                      onReleaseClick,
                      prefetchPointerProps: prefetchPointerProps ?? undefined,
                    })}
                    openRelease={openRelease}
                    releaseTitle={release.basic_information.title}
                    cover={cover}
                    metaLines={metaLines}
                  />
                </div>
              </div>
              {isPlaybackReady && playbackVideoId ? (
                <ReleaseMiniPlayerDigScrub disabled={isPlaybackVideoLoading} />
              ) : null}
              <ReleaseMiniPlayerTransportControls
                volumeControl={
                  isPlaybackReady && playbackVideoId ? (
                    <ReleaseMiniPlayerVolumePopover
                      disabled={isPlaybackVideoLoading}
                    />
                  ) : null
                }
                isMobileLayout={isMobileLayout}
                crateToggleButton={addToMenu}
                isQueueOpen={isQueueOpen}
                queueButtonAriaLabel={queueButtonAriaLabel}
                {...(queueButtonAddon !== undefined
                  ? { queueButtonAddon }
                  : {})}
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
          ) : null}
        </section>
      </OverlayStack>
    </div>
  );
};
