import classNames from "classnames";
import notesStyles from "./ReleaseNotes.module.css";
import formFieldsStyles from "./ReleaseNotesFormFields.module.css";
import styles from "./ReleaseNotesModalSkeleton.module.css";

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
          <span className={styles.labelBar} />
          <span className={styles.textareaBar} />
        </div>
        <div className={styles.conditionFields}>
          <div className={styles.selectGroup}>
            <span className={styles.selectLabel} />
            <span className={styles.selectBar} />
          </div>
          <div className={styles.selectGroup}>
            <span className={styles.selectLabel} />
            <span className={styles.selectBar} />
          </div>
        </div>
      </div>
    </div>
  );
};
