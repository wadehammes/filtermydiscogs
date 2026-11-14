"use client";

import classNames from "classnames";
import styles from "src/components/ReleaseModal/ReleaseModal.module.css";
import { ReleaseModalPlaybackLoadError } from "src/components/ReleaseModal/ReleaseModalPlaybackLoadError.component";
import { ReleaseModalPlaybackTracksFromState } from "src/components/ReleaseModal/ReleaseModalPlaybackTracksFromState.component";
import { useReleaseModalPlayback } from "src/components/ReleaseModal/useReleaseModalPlayback.hook";
import { ReleaseNotes } from "src/components/ReleaseNotes/ReleaseNotes.component";
import { ReleaseNotesEditorProvider } from "src/components/ReleaseNotes/ReleaseNotesEditor.context";
import { ReleaseSimilarSidebar } from "src/components/ReleaseSimilarSidebar/ReleaseSimilarSidebar.component";
import { ReleaseTracklistSkeleton } from "src/components/ReleaseTracklist/ReleaseTracklistSkeleton.component";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";

interface ReleaseModalBodyProps {
  release: DiscogsRelease;
  isOpen: boolean;
  similarReleases?: DiscogsRelease[];
  totalSimilarMatchCount?: number;
  isSimilarLoading?: boolean;
  canShuffleSimilarReleases?: boolean;
  onShuffleSimilarReleases?: () => void;
  onReleaseClick?: (instanceId: string) => void;
}

export const ReleaseModalBody = ({
  release,
  isOpen,
  similarReleases,
  totalSimilarMatchCount,
  isSimilarLoading,
  canShuffleSimilarReleases,
  onShuffleSimilarReleases,
  onReleaseClick,
}: ReleaseModalBodyProps) => {
  const playback = useReleaseModalPlayback({ release, isOpen });
  const { isLoading, isError, releaseDetailError, refetch } = playback;

  return (
    <ReleaseNotesEditorProvider
      key={String(release.instance_id)}
      release={release}
    >
      <div className={styles.body} data-testid="fmdReleaseModalBody">
        {isError ? (
          <ReleaseModalPlaybackLoadError
            error={releaseDetailError}
            onRetry={() => refetch()}
          />
        ) : null}

        <div className={styles.bodyCards}>
          {isLoading ? (
            <section
              className={classNames(styles.modalCard, styles.playbackSection)}
              aria-label="Tracks"
            >
              <ReleaseTracklistSkeleton />
            </section>
          ) : null}

          <ReleaseModalPlaybackTracksFromState
            release={release}
            playback={playback}
          />

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
            {...definedProps({
              totalSimilarMatchCount,
              canShuffleSimilarReleases,
              onReleaseClick,
              onShuffleSimilarReleases,
            })}
          />
        ) : null}
      </div>
    </ReleaseNotesEditorProvider>
  );
};
