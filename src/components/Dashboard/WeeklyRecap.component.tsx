"use client";

import classNames from "classnames";
import { useMemo } from "react";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import dashboardCardStyles from "src/styles/modules/dashboard-card.module.css";
import { definedProps } from "src/utils/definedProps";
import {
  calculateWeeklyRecapSummary,
  formatWeeklyRecapChangePercent,
  getWeeklyRecapHighlight,
  getWeeklyRecapReleases,
} from "src/utils/weeklyRecap";
import { DashboardReleaseItem } from "./DashboardReleaseItem.component";
import styles from "./WeeklyRecap.module.css";

interface WeeklyRecapProps {
  hideHeading?: boolean;
  onReleaseClick?: (instanceId: string) => void;
}

const formatCount = (value: number): string =>
  new Intl.NumberFormat("en-US").format(value);

const formatAddedDate = (dateAdded: string): string => {
  const date = new Date(dateAdded);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export function WeeklyRecap({
  hideHeading = false,
  onReleaseClick,
}: WeeklyRecapProps) {
  const releases = useAllReleases();
  const referenceDate = useMemo(() => new Date(), []);

  const summary = useMemo(
    () => calculateWeeklyRecapSummary(releases, referenceDate),
    [releases, referenceDate],
  );

  const recentReleases = useMemo(
    () => getWeeklyRecapReleases(releases, referenceDate),
    [releases, referenceDate],
  );

  if (!summary) {
    return null;
  }

  const changeLabel = formatWeeklyRecapChangePercent(summary.addsChangePercent);
  const highlight = getWeeklyRecapHighlight(summary);
  const visibleReleases = recentReleases.slice(0, 8);
  const recentAdds = summary.recentPeriodAdds;

  return (
    <div className={styles.container} data-testid="fmdWeeklyRecap">
      {!hideHeading ? <h2>This week</h2> : null}

      <div className={styles.summaryCard}>
        <div className={styles.heroRow}>
          <span className={styles.heroValue}>{formatCount(recentAdds)}</span>
          <span className={styles.heroLabel}>
            {recentAdds === 1 ? "record this week" : "records this week"}
          </span>
          {changeLabel ? (
            <span
              className={classNames(styles.changePill, {
                [styles.changePillPositive]:
                  (summary.addsChangePercent ?? 0) > 0,
                [styles.changePillNegative]:
                  (summary.addsChangePercent ?? 0) < 0,
              })}
            >
              {changeLabel} vs prior week
            </span>
          ) : null}
        </div>

        {highlight ? <p className={styles.highlight}>{highlight}</p> : null}

        {recentAdds === 0 ? (
          <p className={styles.priorWeek}>
            Prior week: {formatCount(summary.priorPeriodAdds)}{" "}
            {summary.priorPeriodAdds === 1 ? "record" : "records"}.
          </p>
        ) : null}
      </div>

      {visibleReleases.length > 0 ? (
        <ul
          aria-label="Records added in the last 7 days"
          className={styles.releasesList}
        >
          {visibleReleases.map((release) => (
            <li key={release.instance_id}>
              <div className={dashboardCardStyles.releaseRow}>
                <DashboardReleaseItem
                  release={release}
                  wrapText
                  {...definedProps({ onReleaseClick })}
                >
                  <div className={styles.dateAdded}>
                    {formatAddedDate(release.date_added)}
                  </div>
                </DashboardReleaseItem>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {recentReleases.length > visibleReleases.length ? (
        <p className={styles.moreText}>
          And {recentReleases.length - visibleReleases.length} more...
        </p>
      ) : null}
    </div>
  );
}
