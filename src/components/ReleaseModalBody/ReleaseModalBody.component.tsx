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
  const playback = useReleaseModalPlayback({ release, isOpen });
  const { isLoading, isError, refetch } = playback;

  return (
    <ReleaseNotesEditorProvider
      key={String(release.instance_id)}
      release={release}
    >
      <div className={styles.body} data-testid="fmdReleaseModalBody">
        {isError ? (
          <ReleaseModalPlaybackLoadError onRetry={() => refetch()} />
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
            {...definedProps({ onReleaseClick })}
          />
        ) : null}
      </div>
    </ReleaseNotesEditorProvider>
  );
};
