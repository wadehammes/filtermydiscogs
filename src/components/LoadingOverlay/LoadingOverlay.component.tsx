import type { FC } from "react";
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
        <div className={styles.spinner} />
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
