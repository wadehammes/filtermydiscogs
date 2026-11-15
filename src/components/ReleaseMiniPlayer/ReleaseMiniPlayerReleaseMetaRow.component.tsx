import type { ReactNode } from "react";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseMiniPlayer.module.css";

export const ReleaseMiniPlayerReleaseMetaRow = ({
  onReleaseClick,
  openRelease,
  prefetchPointerProps,
  releaseTitle,
  cover,
  metaLines,
}: {
  onReleaseClick?: (instanceId: string) => void;
  openRelease: () => void;
  prefetchPointerProps?: Record<string, unknown>;
  releaseTitle: string;
  cover: ReactNode;
  metaLines: ReactNode;
}) => {
  if (onReleaseClick) {
    return (
      <button
        type="button"
        className={styles.openReleaseButton}
        onClick={openRelease}
        aria-label={`Open ${releaseTitle}`}
        title="Open release details"
        {...definedProps(prefetchPointerProps ?? {})}
      >
        {cover}
        <div className={styles.metaLines}>{metaLines}</div>
      </button>
    );
  }

  return (
    <div className={styles.releaseInfo}>
      {cover}
      <div className={styles.metaLines}>{metaLines}</div>
    </div>
  );
};
