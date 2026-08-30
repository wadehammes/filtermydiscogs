"use client";

import Link from "next/link";
import { useMostCratedQuery } from "src/hooks/queries/useMostCratedQuery";
import dashboardCardStyles from "src/styles/modules/dashboard-card.module.css";
import { definedProps } from "src/utils/definedProps";
import { DashboardReleaseItem } from "./DashboardReleaseItem.component";
import styles from "./MostCrated.module.css";

interface MostCratedProps {
  hideHeading?: boolean;
  onReleaseClick?: (instanceId: string) => void;
}

export function MostCrated({
  hideHeading = false,
  onReleaseClick,
}: MostCratedProps) {
  const {
    data: mostCratedReleases,
    isLoading,
    error,
  } = useMostCratedQuery({
    limit: 10,
  });

  if (isLoading) {
    return (
      <div className={styles.container}>
        {!hideHeading && <h2>Most Crated Releases</h2>}
        <p className={styles.loading}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        {!hideHeading && <h2>Most Crated Releases</h2>}
        <p className={styles.error}>Unable to load most crated releases.</p>
      </div>
    );
  }

  if (!mostCratedReleases || mostCratedReleases.length === 0) {
    return (
      <div className={styles.container}>
        {!hideHeading && <h2>Most Crated Releases</h2>}
        <div className={styles.emptyState}>
          <p>No records in multiple crates yet.</p>
          <p className={styles.emptyStateSubtext}>
            Pack the same record into two crates to see it here.
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
      {!hideHeading && <h2>Most Crated Releases</h2>}
      {!hideHeading && (
        <p className={styles.subtitle}>
          Records that show up in more than one crate
        </p>
      )}
      <div className={styles.releasesList}>
        {mostCratedReleases.map((item) => (
          <div
            key={item.instance_id}
            className={dashboardCardStyles.releaseRow}
          >
            <DashboardReleaseItem
              release={item.release}
              {...definedProps({ onReleaseClick })}
            >
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
