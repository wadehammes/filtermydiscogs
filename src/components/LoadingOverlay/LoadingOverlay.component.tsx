import type { FC, ReactNode } from "react";
import Spinner from "src/components/Spinner/Spinner.component";
import styles from "./LoadingOverlay.module.css";

interface LoadingOverlayProps {
  message: string;
  isVisible: boolean;
  hideBackdrop?: boolean;
  progressText?: ReactNode;
}

export const LoadingOverlay: FC<LoadingOverlayProps> = ({
  message,
  isVisible,
  hideBackdrop = false,
  progressText,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`${styles.overlay} ${hideBackdrop ? styles.noBackdrop : ""}`}
    >
      <div className={styles.content}>
        <Spinner size="lg" aria-label={message} />
        <div className={styles.messageContainer}>
          <p className={styles.message}>{message}</p>
          {progressText && (
            <div className={styles.progressText}>{progressText}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
