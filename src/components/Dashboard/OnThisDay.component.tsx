"use client";

import classNames from "classnames";
import { useMemo } from "react";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import dashboardCardStyles from "src/styles/modules/dashboard-card.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getOnThisDayReleases } from "src/utils/onThisDay";
import { DashboardReleaseItem } from "./DashboardReleaseItem.component";
import styles from "./OnThisDay.module.css";

const ANALYTICS_CATEGORY = "onThisDay";

interface OnThisDayProps {
  hideHeading?: boolean;
  onReleaseClick?: (instanceId: string) => void;
}

interface OnThisDayYearGroup {
  year: number;
  releases: DiscogsRelease[];
}

interface OnThisDayCardProps {
  release: DiscogsRelease;
  showYearBadge: boolean;
  onReleaseClick?: (instanceId: string) => void;
}

function OnThisDayCard({
  release,
  showYearBadge,
  onReleaseClick,
}: OnThisDayCardProps) {
  const yearAdded = new Date(release.date_added).getFullYear();

  return (
    <li className={styles.cardItem}>
      <article
        className={classNames(dashboardCardStyles.releaseRow, {
          [styles.cardWithBadge]: showYearBadge,
        })}
      >
        {showYearBadge ? (
          <span className={styles.yearBadge}>Added {yearAdded}</span>
        ) : null}
        <div className={styles.releaseItemWrap}>
          <DashboardReleaseItem
            release={release}
            category={ANALYTICS_CATEGORY}
            {...definedProps({ onReleaseClick })}
          />
        </div>
      </article>
    </li>
  );
}

const groupReleasesByYear = (
  releases: DiscogsRelease[],
): OnThisDayYearGroup[] => {
  const groups: OnThisDayYearGroup[] = [];

  for (const release of releases) {
    const year = new Date(release.date_added).getFullYear();
    const lastGroup = groups[groups.length - 1];

    if (lastGroup?.year === year) {
      lastGroup.releases.push(release);
      continue;
    }

    groups.push({ year, releases: [release] });
  }

  return groups;
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
        <p className={styles.emptyInline}>
          No records added on this date in earlier years.
        </p>
      </div>
    );
  }

  const visibleReleases = onThisDayReleases.slice(0, 10);
  const yearGroups = groupReleasesByYear(visibleReleases);
  const showYearHeaders = yearGroups.length > 1;

  return (
    <div className={styles.container}>
      {!hideHeading ? <h2>On this day</h2> : null}
      {!hideHeading ? <p className={styles.date}>{dateString}</p> : null}
      <div className={styles.yearStack}>
        {yearGroups.map((group) => (
          <section
            key={group.year}
            className={styles.yearGroup}
            aria-label={`Records added in ${group.year}`}
          >
            {showYearHeaders ? (
              <h3 className={styles.yearHeading}>{group.year}</h3>
            ) : null}
            <ul
              className={classNames(styles.cardList, {
                [styles.cardListSingle]: group.releases.length === 1,
              })}
            >
              {group.releases.map((release) => (
                <OnThisDayCard
                  key={release.instance_id}
                  release={release}
                  showYearBadge={!showYearHeaders}
                  {...definedProps({ onReleaseClick })}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      {onThisDayReleases.length > 10 ? (
        <p className={styles.moreText}>
          And {onThisDayReleases.length - 10} more...
        </p>
      ) : null}
    </div>
  );
}
