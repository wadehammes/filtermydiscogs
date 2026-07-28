"use client";

import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import styles from "./CrateDrawerNotes.module.css";

export const CrateDrawerNotes = () => {
  const { crateNotes, setShowCrateNotesDialog } = useCrateDrawerContext();

  if (!crateNotes.trim()) {
    return null;
  }

  return (
    <section className={styles.notesSection} aria-label="Crate notes">
      <div className={styles.notesHeader}>
        <h3 className={styles.notesTitle}>Notes</h3>
        <button
          type="button"
          className={styles.editNotesButton}
          onClick={() => setShowCrateNotesDialog(true)}
        >
          Edit
        </button>
      </div>
      <p className={styles.notesBody}>{crateNotes}</p>
    </section>
  );
};
