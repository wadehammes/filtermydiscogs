"use client";

import classNames from "classnames";
import Button from "src/components/Button/Button.component";
import { ReleaseNotes } from "src/components/ReleaseNotes/ReleaseNotes.component";
import { ReleaseNotesEditorProvider } from "src/components/ReleaseNotes/ReleaseNotesEditor.context";
import { Spinner } from "src/components/Spinner/Spinner.component";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { formatArtistNames } from "src/utils/releaseDisplay";
import styles from "./ReleaseModal.module.css";
import { ReleasePlaybackFallback } from "./ReleasePlaybackFallback.component";
import { ReleasePlaybackPreview } from "./ReleasePlaybackPreview.component";
import { ReleaseSimilarSidebar } from "./ReleaseSimilarSidebar.component";
import { ReleaseTracklist } from "./ReleaseTracklist.component";
import { useReleaseModalPlayback } from "./useReleaseModalPlayback.hook";

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
        {isLoading ? (
          <div className={styles.loadingState}>
            <Spinner size="md" aria-label="Loading release details" />
            <p className={styles.loadingMessage}>Loading tracklist…</p>
          </div>
        ) : null}

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
                onTrackQueue: hasPlayableTracks ? handleTrackQueue : undefined,
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
