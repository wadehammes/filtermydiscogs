"use client";

import Spinner from "src/components/Spinner/Spinner.component";
import styles from "./loading.module.css";

/**
 * Loading UI for the releases page.
 * Shows instantly while the page is loading, improving perceived performance.
 */
export default function ReleasesLoadingPage() {
  return (
    <div className={styles.container}>
      <Spinner
        size="3xl"
        className={styles.spinner}
        aria-label="Loading releases"
      />
      <p className={styles.text}>Loading releases...</p>
    </div>
  );
}
