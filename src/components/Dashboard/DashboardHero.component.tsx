"use client";

import classNames from "classnames";
import { useMemo } from "react";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import type {
  CollectionStats,
  CollectionValue,
} from "src/types/dashboard.types";
import type { DashboardStory } from "src/utils/dashboardStory";
import styles from "./DashboardHero.module.css";

interface DashboardHeroProps {
  story: DashboardStory;
  stats: CollectionStats;
  collectionValue: CollectionValue | undefined;
  isLoadingValue: boolean;
  valueError: Error | null;
}

export function DashboardHero({
  story,
  stats,
  collectionValue,
  isLoadingValue,
  valueError,
}: DashboardHeroProps) {
  const releases = useAllReleases();

  const yearOverYearChange = useMemo(() => {
    if (!releases || releases.length === 0) {
      return null;
    }

    const today = new Date();
    const thisTimeLastYear = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDate(),
    );

    let totalLastYear = 0;

    releases.forEach((release) => {
      const dateAdded = new Date(release.date_added);
      if (!Number.isNaN(dateAdded.getTime()) && dateAdded <= thisTimeLastYear) {
        totalLastYear += 1;
      }
    });

    if (totalLastYear === 0) {
      return null;
    }

    const totalToday = releases.length;
    const change = ((totalToday - totalLastYear) / totalLastYear) * 100;

    return {
      percentage: Math.abs(change),
      isPositive: change > 0,
    };
  }, [releases]);

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) {
      return "—";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const showMetrics = !story.heroFallback;

  return (
    <header className={styles.hero} data-testid="fmdDashboardHero">
      <div className={styles.intro}>
        <p className={styles.eyebrow}>{story.heroEyebrow}</p>
        <h1 className={styles.title}>{story.heroTitle}</h1>

        <div className={styles.countBlock}>
          <div className={styles.countRow}>
            <span className={styles.count} data-testid="fmdDashboardHeroCount">
              {story.heroCount}
            </span>
            <span className={styles.countLabel}>records</span>
            {yearOverYearChange && (
              <span
                className={classNames(styles.yearChange, {
                  [styles.positive]: yearOverYearChange.isPositive,
                  [styles.negative]: !yearOverYearChange.isPositive,
                })}
              >
                {yearOverYearChange.isPositive ? "+" : "-"}
                {yearOverYearChange.percentage.toFixed(1)}% vs last year
              </span>
            )}
          </div>

          {story.heroFallback ? (
            <p className={styles.fallback}>{story.heroFallback}</p>
          ) : (
            story.heroTagline && (
              <p className={styles.tagline}>{story.heroTagline}</p>
            )
          )}
        </div>
      </div>

      {showMetrics && (
        <aside aria-label="Collection snapshot" className={styles.metricsPanel}>
          <dl className={styles.metricsList}>
            <div className={styles.metricItem}>
              <dt className={styles.metricLabel}>Estimated value</dt>
              <dd className={styles.metricValue}>
                {isLoadingValue ? (
                  <span className={styles.loading}>Loading…</span>
                ) : valueError ? (
                  <span className={styles.error}>Unavailable</span>
                ) : collectionValue ? (
                  formatCurrency(collectionValue.median)
                ) : (
                  "—"
                )}
              </dd>
              {collectionValue && !isLoadingValue && !valueError && (
                <dd className={styles.metricMeta}>
                  {formatCurrency(collectionValue.minimum)} to{" "}
                  {formatCurrency(collectionValue.maximum)}
                </dd>
              )}
            </div>

            <div className={styles.metricItem}>
              <dt className={styles.metricLabel}>Average rating</dt>
              <dd className={styles.metricValue}>
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
              </dd>
              {stats.averageRating > 0 && (
                <dd className={styles.metricMeta}>out of 5</dd>
              )}
            </div>
          </dl>
        </aside>
      )}
    </header>
  );
}
