"use client";

import Spinner from "src/components/Spinner/Spinner.component";
import styles from "./loading.module.css";

/**
 * Root loading UI.
 * Shows instantly while the root layout or initial page is loading.
 */
export default function RootLoading() {
  return (
    <div className={styles.container}>
      <Spinner size="3xl" className={styles.spinner} aria-label="Loading" />
      <p className={styles.text}>Loading...</p>
    </div>
  );
}
