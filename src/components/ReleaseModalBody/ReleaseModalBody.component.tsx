"use client";

import classNames from "classnames";
import Button from "src/components/Button/Button.component";
import styles from "src/components/ReleaseModal/ReleaseModal.module.css";
import { useReleaseModalPlayback } from "src/components/ReleaseModal/useReleaseModalPlayback.hook";
import { ReleaseNotes } from "src/components/ReleaseNotes/ReleaseNotes.component";
import { ReleaseNotesEditorProvider } from "src/components/ReleaseNotes/ReleaseNotesEditor.context";
import { ReleasePlaybackFallback } from "src/components/ReleasePlaybackFallback/ReleasePlaybackFallback.component";
import { ReleasePlaybackPreview } from "src/components/ReleasePlaybackPreview/ReleasePlaybackPreview.component";
import { ReleaseSimilarSidebar } from "src/components/ReleaseSimilarSidebar/ReleaseSimilarSidebar.component";
import { ReleaseTracklist } from "src/components/ReleaseTracklist/ReleaseTracklist.component";
import { ReleaseTracklistSkeleton } from "src/components/ReleaseTracklist/ReleaseTracklistSkeleton.component";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { formatArtistNames } from "src/utils/releaseDisplay";

interface ReleaseModalBodyProps {
  release: DiscogsRelease;
  isOpen: boolean;
  similarReleases?: DiscogsRelease[];
  isSimilarLoading?: boolean;
  onReleaseClick?: (instanceId: string) => void;
}

export const ReleaseModalBody = ({
  release,
  isOpen,
  similarReleases,
  isSimilarLoading,
  onReleaseClick,
}: ReleaseModalBodyProps) => {
  const {
    tracks,
    videos,
    hasEmbeddableVideo,
    hasPlayableTracks,
    releasePreviewVideos,
    releasePreviewTracks,
    isTrackPlayable,
    activeTrackPosition,
    activePreviewTrackPosition,
    fallbackSearchUrl,
    isLoading,
    isError,
    refetch,
    handleTrackSelect,
    handleTrackQueue,
    handleAddAllToQueue,
    allPlayableTracksQueued,
    handlePreviewTrackSelect,
    handlePreviewTrackQueue,
    isTrackQueued,
    isPreviewTrackQueued,
    handleActiveTrackToggle,
    isPlayingThisReleaseInBar,
    isPlaybackPaused,
    isReleasePreviewPlaying,
  } = useReleaseModalPlayback({ release, isOpen });

  const reserveQueueColumn =
    hasPlayableTracks || releasePreviewVideos.length > 0;

  return (
    <ReleaseNotesEditorProvider release={release}>
      <div className={styles.body} data-testid="fmdReleaseModalBody">
        {isError ? (
          <div className={styles.errorState}>
            <p className={styles.errorMessage}>
              Could not load track listing for this release.
            </p>
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : null}

        <div className={styles.modalContent}>
          {isLoading ? (
            <section
              className={classNames(styles.modalCard, styles.playbackSection)}
              aria-label="Tracks"
            >
              <ReleaseTracklistSkeleton />
            </section>
          ) : null}

          {!(isLoading || isError) ? (
            <section
              className={classNames(styles.modalCard, styles.playbackSection)}
              aria-label="Tracks"
            >
              {!hasEmbeddableVideo ? (
                <ReleasePlaybackFallback
                  fallbackSearchUrl={fallbackSearchUrl}
                  videos={videos}
                />
              ) : null}
              <ReleaseTracklist
                tracks={tracks}
                releaseArtistNames={formatArtistNames(release)}
                activeTrackPosition={activeTrackPosition}
                reserveQueueColumn={reserveQueueColumn}
                showPlayingIndicatorOnActiveTrack={
                  hasPlayableTracks &&
                  isPlayingThisReleaseInBar &&
                  !isReleasePreviewPlaying
                }
                isPlaybackPaused={
                  hasPlayableTracks &&
                  isPlayingThisReleaseInBar &&
                  !isReleasePreviewPlaying
                    ? isPlaybackPaused
                    : false
                }
                {...definedProps({
                  isTrackPlayable: hasPlayableTracks
                    ? isTrackPlayable
                    : undefined,
                  onTrackSelect: hasPlayableTracks
                    ? handleTrackSelect
                    : undefined,
                  isTrackQueued: hasPlayableTracks ? isTrackQueued : undefined,
                  onTrackQueue: hasPlayableTracks
                    ? handleTrackQueue
                    : undefined,
                  onAddAllToQueue: hasPlayableTracks
                    ? handleAddAllToQueue
                    : undefined,
                  addAllToQueueDisabled: hasPlayableTracks
                    ? allPlayableTracksQueued
                    : undefined,
                  onActiveTrackToggle:
                    hasPlayableTracks &&
                    isPlayingThisReleaseInBar &&
                    !isReleasePreviewPlaying
                      ? handleActiveTrackToggle
                      : undefined,
                })}
              />
              {releasePreviewVideos.length > 0 ? (
                <ReleasePlaybackPreview
                  tracks={releasePreviewTracks}
                  releaseArtistNames={formatArtistNames(release)}
                  activeTrackPosition={activePreviewTrackPosition}
                  showPlayingIndicatorOnActiveTrack={
                    isPlayingThisReleaseInBar && isReleasePreviewPlaying
                  }
                  isPlaybackPaused={
                    isPlayingThisReleaseInBar && isReleasePreviewPlaying
                      ? isPlaybackPaused
                      : false
                  }
                  isTrackQueued={isPreviewTrackQueued}
                  onTrackSelect={handlePreviewTrackSelect}
                  onTrackQueue={handlePreviewTrackQueue}
                  {...definedProps({
                    onActiveTrackToggle:
                      isPlayingThisReleaseInBar && isReleasePreviewPlaying
                        ? handleActiveTrackToggle
                        : undefined,
                  })}
                />
              ) : null}
            </section>
          ) : null}

          <section
            className={classNames(styles.modalCard, styles.notesSection)}
            aria-label="Release notes"
          >
            <ReleaseNotes release={release} variant="modal" />
          </section>
        </div>

        {similarReleases !== undefined ? (
          <ReleaseSimilarSidebar
            variant="inline"
            similarReleases={similarReleases}
            isLoading={isSimilarLoading ?? false}
            {...definedProps({ onReleaseClick })}
          />
        ) : null}
      </div>
    </ReleaseNotesEditorProvider>
  );
};
