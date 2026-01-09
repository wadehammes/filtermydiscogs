"use client";

import Spinner from "src/components/Spinner/Spinner.component";
import styles from "./loading.module.css";

/**
 * Loading UI for the dashboard page.
 * Shows instantly while the page is loading, improving perceived performance.
 */
export default function DashboardLoading() {
  return (
    <div className={styles.container}>
      <Spinner
        size="3xl"
        className={styles.spinner}
        aria-label="Loading dashboard"
      />
      <p className={styles.text}>Loading dashboard...</p>
    </div>
  );
}
