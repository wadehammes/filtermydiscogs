"use client";

import Spinner from "src/components/Spinner/Spinner.component";
import styles from "./loading.module.css";

/**
 * Loading UI for the mosaic page.
 * Shows instantly while the page is loading, improving perceived performance.
 */
export default function MosaicLoadingPage() {
  return (
    <div className={styles.container}>
      <Spinner
        size="3xl"
        className={styles.spinner}
        aria-label="Loading mosaic"
      />
      <p className={styles.text}>Loading mosaic...</p>
    </div>
  );
}
