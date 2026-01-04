"use client";

import styles from "./loading.module.css";

/**
 * Root loading UI.
 * Shows instantly while the root layout or initial page is loading.
 */
export default function RootLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <p className={styles.text}>Loading...</p>
    </div>
  );
}
