"use client";

import Button from "src/components/Button/Button.component";
import styles from "src/components/ReleaseModal/ReleaseModal.module.css";

interface ReleaseModalPlaybackLoadErrorProps {
  onRetry: () => void;
}

export const ReleaseModalPlaybackLoadError = ({
  onRetry,
}: ReleaseModalPlaybackLoadErrorProps) => (
  <div className={styles.errorState}>
    <p className={styles.errorMessage}>
      Could not load track listing for this release.
    </p>
    <Button type="button" variant="secondary" onClick={onRetry}>
      Try again
    </Button>
  </div>
);
