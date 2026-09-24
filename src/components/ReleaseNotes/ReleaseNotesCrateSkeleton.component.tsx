import classNames from "classnames";
import skeletonPulseStyles from "src/styles/modules/skeleton-pulse.module.css";
import notesStyles from "./ReleaseNotes.module.css";
import styles from "./ReleaseNotesCrateSkeleton.module.css";

const pulseSurface = skeletonPulseStyles.pulsesurface;

export const ReleaseNotesCrateSkeleton = () => {
  return (
    <div
      className={classNames(
        notesStyles.notes,
        notesStyles.notesCrateScratchpad,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading release notes"
      data-testid="fmdReleaseNotesCrateSkeleton"
    >
      <div className={styles.fieldStack} aria-hidden>
        <div className={styles.selectGroup}>
          <span className={classNames(styles.selectLabel, pulseSurface)} />
          <span className={classNames(styles.selectBar, pulseSurface)} />
        </div>
        <div className={styles.fieldGroup}>
          <span className={classNames(styles.textareaBar, pulseSurface)} />
          <span className={classNames(styles.countBar, pulseSurface)} />
        </div>
      </div>
    </div>
  );
};
