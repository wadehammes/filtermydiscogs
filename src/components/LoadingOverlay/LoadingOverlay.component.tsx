import type { FC } from "react";
import Spinner from "src/components/Spinner/Spinner.component";
import styles from "./LoadingOverlay.module.css";

interface LoadingOverlayProps {
  message: string;
  isVisible: boolean;
}

export const LoadingOverlay: FC<LoadingOverlayProps> = ({
  message,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <Spinner size="lg" aria-label={message} />
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
