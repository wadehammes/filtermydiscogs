import type { ReactNode } from "react";
import { Spinner } from "src/components/Spinner/Spinner.component";
import styles from "./LoadingOverlay.module.css";

interface LoadingOverlayProps {
  message: string;
  isVisible: boolean;
  hideBackdrop?: boolean;
  progressText?: ReactNode;
}

export const LoadingOverlay = ({
  message,
  isVisible,
  hideBackdrop = false,
  progressText,
}: LoadingOverlayProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`${styles.overlay} ${hideBackdrop ? styles.noBackdrop : ""}`}
      data-testid="fmdLoadingOverlay"
    >
      <div className={styles.content}>
        <Spinner size="lg" aria-label={message} />
        <div className={styles.messageContainer}>
          <p className={styles.message}>{message}</p>
          {progressText ? (
            <div className={styles.progressText}>{progressText}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
