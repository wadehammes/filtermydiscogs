import classNames from "classnames";
import skeletonPulseStyles from "src/styles/modules/skeleton-pulse.module.css";
import notesStyles from "./ReleaseNotes.module.css";
import formFieldsStyles from "./ReleaseNotesFormFields.module.css";
import styles from "./ReleaseNotesModalSkeleton.module.css";

const pulseSurface = skeletonPulseStyles.pulsesurface;

export const ReleaseNotesModalSkeleton = () => {
  return (
    <div
      className={classNames(notesStyles.notes, notesStyles.notesModal)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading release notes"
      data-testid="fmdReleaseNotesModalSkeleton"
    >
      <div className={formFieldsStyles.modalLayout} aria-hidden>
        <div className={styles.fieldGroup}>
          <span className={classNames(styles.labelBar, pulseSurface)} />
          <span className={classNames(styles.textareaBar, pulseSurface)} />
        </div>
        <div className={styles.conditionFields}>
          <div className={styles.selectGroup}>
            <span className={classNames(styles.selectLabel, pulseSurface)} />
            <span className={classNames(styles.selectBar, pulseSurface)} />
          </div>
          <div className={styles.selectGroup}>
            <span className={classNames(styles.selectLabel, pulseSurface)} />
            <span className={classNames(styles.selectBar, pulseSurface)} />
          </div>
        </div>
      </div>
    </div>
  );
};
