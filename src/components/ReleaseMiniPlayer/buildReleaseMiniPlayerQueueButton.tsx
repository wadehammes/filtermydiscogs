import type { ReactNode } from "react";
import { Spinner } from "src/components/Spinner/Spinner.component";
import styles from "./ReleaseMiniPlayer.module.css";

export const buildReleaseMiniPlayerQueueButton = ({
  isQueueBuilding,
  queueLength,
}: {
  isQueueBuilding: boolean;
  queueLength: number;
}): { ariaLabel: string; addon: ReactNode | undefined } => {
  if (isQueueBuilding) {
    return {
      ariaLabel: "Open playback queue, building",
      addon: (
        <span className={styles.queueCount}>
          <Spinner
            size="xs"
            className={styles.queueCountSpinner}
            aria-label="Building playback queue"
          />
        </span>
      ),
    };
  }

  if (queueLength > 0) {
    return {
      ariaLabel: `Open playback queue, ${queueLength} tracks`,
      addon: <span className={styles.queueCount}>{queueLength}</span>,
    };
  }

  return {
    ariaLabel: "Open playback queue",
    addon: undefined,
  };
};
