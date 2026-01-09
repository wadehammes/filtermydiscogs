import type { FC } from "react";
import Spinner from "src/components/Spinner/Spinner.component";
import styles from "./LogoutOverlay.module.css";

interface LogoutOverlayProps {
  isVisible: boolean;
}

export const LogoutOverlay: FC<LogoutOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <Spinner
          size="xl"
          className={styles.spinner}
          aria-label="Logging out"
        />
        <h2 className={styles.title}>Logging Out of Discogs</h2>
        <p className={styles.subtitle}>Please wait while we log you out...</p>
      </div>
    </div>
  );
};

export default LogoutOverlay;
