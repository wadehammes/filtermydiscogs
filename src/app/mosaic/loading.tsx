"use client";

import styles from "./loading.module.css";

/**
 * Loading UI for the mosaic page.
 * Shows instantly while the page is loading, improving perceived performance.
 */
export default function MosaicLoadingPage() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <p className={styles.text}>Loading mosaic...</p>
    </div>
  );
}
