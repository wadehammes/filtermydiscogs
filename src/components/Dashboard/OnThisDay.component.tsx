"use client";

import { useMemo } from "react";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import dashboardCardStyles from "src/styles/modules/dashboard-card.module.css";
import { definedProps } from "src/utils/definedProps";
import { getOnThisDayReleases } from "src/utils/onThisDay";
import { DashboardReleaseItem } from "./DashboardReleaseItem.component";
import styles from "./OnThisDay.module.css";

interface OnThisDayProps {
  hideHeading?: boolean;
  onReleaseClick?: (instanceId: string) => void;
}

const formatYearsAgo = (yearAdded: number, currentYear: number): string => {
  const yearsAgo = currentYear - yearAdded;

  if (yearsAgo <= 0) {
    return "this year";
  }

  return yearsAgo === 1 ? "1 yr ago" : `${yearsAgo} yrs ago`;
};

export function OnThisDay({
  hideHeading = false,
  onReleaseClick,
}: OnThisDayProps) {
  const releases = useAllReleases();

  const onThisDayReleases = useMemo(() => {
    return getOnThisDayReleases(releases || []);
  }, [releases]);

  const today = new Date();
  const currentYear = today.getFullYear();
  const dateString = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  if (onThisDayReleases.length === 0) {
    if (hideHeading) {
      return null;
    }

    return (
      <div className={styles.container}>
        <h2>On this day</h2>
        <p className={styles.date}>{dateString}</p>
        <div className={styles.emptyState}>
          <p>No records added on this date in earlier years.</p>
        </div>
      </div>
    );
  }

  const visibleReleases = onThisDayReleases.slice(0, 10);

  return (
    <div className={styles.container}>
      {!hideHeading ? <h2>On this day</h2> : null}
      {!hideHeading ? <p className={styles.date}>{dateString}</p> : null}
      <ul
        aria-label="Records added on this calendar date in earlier years"
        className={styles.releasesList}
      >
        {visibleReleases.map((release) => {
          const yearAdded = new Date(release.date_added).getFullYear();

          return (
            <li key={release.instance_id}>
              <div className={dashboardCardStyles.releaseRow}>
                <DashboardReleaseItem
                  release={release}
                  wrapText
                  {...definedProps({ onReleaseClick })}
                >
                  <div className={styles.yearAdded}>
                    <span className={styles.yearAddedValue}>{yearAdded}</span>
                    <span className={styles.yearAddedLabel}>
                      {formatYearsAgo(yearAdded, currentYear)}
                    </span>
                  </div>
                </DashboardReleaseItem>
              </div>
            </li>
          );
        })}
      </ul>
      {onThisDayReleases.length > 10 ? (
        <p className={styles.moreText}>
          And {onThisDayReleases.length - 10} more...
        </p>
      ) : null}
    </div>
  );
}
