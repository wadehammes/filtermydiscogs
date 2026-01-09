"use client";

import Link from "next/link";
import { useMostCratedQuery } from "src/hooks/queries/useMostCratedQuery";
import { DashboardReleaseItem } from "./DashboardReleaseItem.component";
import styles from "./MostCrated.module.css";

export function MostCrated() {
  const { data: mostCratedReleases, isLoading, error } = useMostCratedQuery(10);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h2>Most Crated Releases</h2>
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2>Most Crated Releases</h2>
        <p className={styles.error}>Unable to load most crated releases.</p>
      </div>
    );
  }

  if (!mostCratedReleases || mostCratedReleases.length === 0) {
    return (
      <div className={styles.container}>
        <h2>Most Crated Releases</h2>
        <div className={styles.emptyState}>
          <p>No releases appear in multiple crates yet.</p>
          <p className={styles.emptyStateSubtext}>
            Add releases to multiple crates to see them here.
          </p>
          <Link href="/releases" className={styles.emptyStateLink}>
            Go to Releases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Most Crated Releases</h2>
      <p className={styles.subtitle}>
        Releases that appear in multiple of your crates
      </p>
      <div className={styles.releasesList}>
        {mostCratedReleases.map((item) => (
          <div key={item.instance_id} className={styles.releaseItem}>
            <DashboardReleaseItem release={item.release} category="mostCrated">
              <div className={styles.crateCount}>
                <span className={styles.countNumber}>{item.crate_count}</span>
                <span className={styles.countLabel}>
                  {item.crate_count === 1 ? "crate" : "crates"}
                </span>
              </div>
            </DashboardReleaseItem>
          </div>
        ))}
      </div>
    </div>
  );
}
