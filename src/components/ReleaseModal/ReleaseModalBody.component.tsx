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
    activeTrackPosition,
    fallbackSearchUrl,
    isLoading,
    isError,
    refetch,
    handleTrackSelect,
    handleTrackQueue,
    isTrackQueued,
    handleActiveTrackToggle,
    isPlayingThisReleaseInBar,
    isPlaybackPaused,
  } = useReleaseModalPlayback({ release, isOpen });

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
              activeTrackPosition={
                hasEmbeddableVideo ? activeTrackPosition : null
              }
              showPlayingIndicatorOnActiveTrack={
                hasEmbeddableVideo && isPlayingThisReleaseInBar
              }
              isPlaybackPaused={
                hasEmbeddableVideo && isPlayingThisReleaseInBar
                  ? isPlaybackPaused
                  : false
              }
              {...definedProps({
                onTrackSelect: hasEmbeddableVideo
                  ? handleTrackSelect
                  : undefined,
                isTrackQueued: hasEmbeddableVideo ? isTrackQueued : undefined,
                onTrackQueue: hasEmbeddableVideo ? handleTrackQueue : undefined,
                onActiveTrackToggle:
                  hasEmbeddableVideo && isPlayingThisReleaseInBar
                    ? handleActiveTrackToggle
                    : undefined,
              })}
            />
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
