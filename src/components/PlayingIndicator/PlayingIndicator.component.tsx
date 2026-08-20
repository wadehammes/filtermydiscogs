import styles from "./PlayingIndicator.module.css";

interface PlayingIndicatorProps {
  isPaused?: boolean;
}

export const PlayingIndicator = ({
  isPaused = false,
}: PlayingIndicatorProps) => (
  <span
    className={styles.playingIndicator}
    data-testid="fmdPlayingIndicator"
    data-playback-state={isPaused ? "paused" : "playing"}
    aria-hidden
  >
    {isPaused ? (
      <>
        <span className={styles.bar} />
        <span className={styles.bar} />
      </>
    ) : (
      <>
        <span className={styles.barAnimated} />
        <span className={styles.barAnimated} />
        <span className={styles.barAnimated} />
      </>
    )}
  </span>
);
