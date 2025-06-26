import type { FC } from "react";
import styles from "./LogoutOverlay.module.css";

interface LogoutOverlayProps {
  isVisible: boolean;
}

export const LogoutOverlay: FC<LogoutOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.spinner} />
        <h2 className={styles.title}>Logging Out of Discogs</h2>
        <p className={styles.subtitle}>Please wait while we log you out...</p>
      </div>
    </div>
  );
};

export default LogoutOverlay;
