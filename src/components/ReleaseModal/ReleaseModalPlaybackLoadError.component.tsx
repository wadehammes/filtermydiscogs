"use client";

import Button from "src/components/Button/Button.component";
import { DiscogsExternalLink } from "src/components/DiscogsExternalLink/DiscogsExternalLink.component";
import styles from "src/components/ReleaseModal/ReleaseModal.module.css";
import {
  DISCOGS_STATUS_URL,
  getReleaseModalDetailLoadErrorContent,
  ReleaseModalDetailLoadErrorKind,
} from "src/components/ReleaseModal/releaseModalDetailLoadError";

interface ReleaseModalPlaybackLoadErrorProps {
  error: unknown;
  onRetry: () => void;
}

export const ReleaseModalPlaybackLoadError = ({
  error,
  onRetry,
}: ReleaseModalPlaybackLoadErrorProps) => {
  const { kind, title, message } = getReleaseModalDetailLoadErrorContent(error);

  return (
    <div
      className={styles.errorState}
      data-testid="fmdReleaseModalDetailLoadError"
    >
      {title ? <p className={styles.errorTitle}>{title}</p> : null}
      <p className={styles.errorMessage}>
        {message}
        {kind === ReleaseModalDetailLoadErrorKind.DiscogsOutage ? (
          <>
            {" "}
            <DiscogsExternalLink
              href={DISCOGS_STATUS_URL}
              variant="text"
              label="Discogs status"
            />
          </>
        ) : null}
      </p>
      <Button type="button" variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
};
