import classNames from "classnames";
import accessibility from "src/styles/modules/accessibility.module.css";
import type { TrackDjMetadata } from "src/types/trackMetadata.types";
import {
  formatDjMetadataLine,
  formatDjMetadataPrimary,
  formatDjMetadataSecondary,
} from "src/utils/formatDjMetadata";
import styles from "./TrackDjMetadataDisplay.module.css";

interface TrackDjMetadataDisplayProps {
  metadata?: TrackDjMetadata | null | undefined;
  isLoading?: boolean;
  variant?: "tracklist" | "crate";
  className?: string;
}

export const TrackDjMetadataDisplay = ({
  metadata,
  isLoading = false,
  variant = "tracklist",
  className,
}: TrackDjMetadataDisplayProps) => {
  const line = formatDjMetadataLine(metadata);
  const bpm = formatDjMetadataPrimary(metadata);
  const key = formatDjMetadataSecondary(metadata);

  return (
    <div className={classNames(styles.root, styles[variant], className)}>
      {isLoading ? (
        <>
          <span className={accessibility.visuallyHidden}>
            Loading DJ metadata
          </span>
          <span className={styles.loading} aria-hidden>
            …
          </span>
        </>
      ) : line ? (
        <>
          {bpm ? <span className={styles.bpm}>{bpm}</span> : null}
          {key ? <span className={styles.key}>{key}</span> : null}
        </>
      ) : (
        <span className={styles.empty} aria-hidden>
          —
        </span>
      )}
    </div>
  );
};
