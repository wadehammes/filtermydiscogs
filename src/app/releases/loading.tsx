"use client";

import styles from "./loading.module.css";

/**
 * Loading UI for the releases page.
 * Shows instantly while the page is loading, improving perceived performance.
 */
export default function ReleasesLoadingPage() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <p className={styles.text}>Loading releases...</p>
    </div>
  );
}
