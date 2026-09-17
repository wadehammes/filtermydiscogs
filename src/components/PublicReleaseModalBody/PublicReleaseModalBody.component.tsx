"use client";

import styles from "src/components/ReleaseModal/ReleaseModal.module.css";
import { ReleaseModalPlaybackLoadError } from "src/components/ReleaseModal/ReleaseModalPlaybackLoadError.component";
import { ReleaseModalPlaybackTracksFromState } from "src/components/ReleaseModal/ReleaseModalPlaybackTracksFromState.component";
import { useReleaseModalPlayback } from "src/components/ReleaseModal/useReleaseModalPlayback.hook";
import { Spinner } from "src/components/Spinner/Spinner.component";
import type { DiscogsRelease } from "src/types";

interface PublicReleaseModalBodyProps {
  release: DiscogsRelease;
  isOpen: boolean;
}

export const PublicReleaseModalBody = ({
  release,
  isOpen,
}: PublicReleaseModalBodyProps) => {
  const playback = useReleaseModalPlayback({ release, isOpen });
  const { isLoading, isError, refetch } = playback;

  return (
    <div className={styles.body} data-testid="fmdPublicReleaseModalBody">
      {isLoading ? (
        <div className={styles.loadingState}>
          <Spinner size="md" aria-label="Loading release details" />
          <p className={styles.loadingMessage}>Loading tracklist…</p>
        </div>
      ) : null}

      {isError ? (
        <ReleaseModalPlaybackLoadError onRetry={() => refetch()} />
      ) : null}

      <ReleaseModalPlaybackTracksFromState
        release={release}
        playback={playback}
      />
    </div>
  );
};
