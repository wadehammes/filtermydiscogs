"use client";

import { useMemo } from "react";
import { useCollectionContext } from "src/context/collection.context";
import type {
  CollectionStats,
  CollectionValue,
} from "src/types/dashboard.types";
import styles from "./StatsCards.module.css";

interface StatsCardsProps {
  stats: CollectionStats;
  collectionValue: CollectionValue | undefined;
  isLoadingValue: boolean;
  valueError: Error | null;
}

export function StatsCards({
  stats,
  collectionValue,
  isLoadingValue,
  valueError,
}: StatsCardsProps) {
  const { state: collectionState } = useCollectionContext();
  const { releases } = collectionState;

  const yearOverYearChange = useMemo(() => {
    if (!releases || releases.length === 0) {
      return null;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    const currentDay = today.getDate(); // 1-31

    // Create date for this time last year (same month and day)
    const thisTimeLastYear = new Date(
      currentYear - 1,
      currentMonth,
      currentDay,
    );

    // Count total collection size today (all releases added up to today)
    const totalToday = releases.length;

    // Count collection size at this time last year (releases added up to same date last year)
    let totalLastYear = 0;

    releases.forEach((release) => {
      try {
        const dateAdded = new Date(release.date_added);
        if (Number.isNaN(dateAdded.getTime())) {
          return;
        }

        // Count releases that were added on or before this date last year
        if (dateAdded <= thisTimeLastYear) {
          totalLastYear++;
        }
      } catch {
        // Skip invalid dates
      }
    });

    if (totalLastYear === 0) {
      return null; // Can't calculate if no data from this time last year
    }

    const change = ((totalToday - totalLastYear) / totalLastYear) * 100;
    return {
      percentage: Math.abs(change),
      isPositive: change > 0,
      totalToday,
      totalLastYear,
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

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>Estimated Collection Value</div>
        <div className={styles.statValue}>
          {isLoadingValue ? (
            <span className={styles.loading}>Loading...</span>
          ) : valueError ? (
            <span className={styles.error}>
              Unable to load
              {process.env.NODE_ENV === "development" && valueError.message && (
                <span className={styles.errorDetails}>
                  {" "}
                  ({valueError.message})
                </span>
              )}
            </span>
          ) : collectionValue ? (
            formatCurrency(collectionValue.median)
          ) : (
            "—"
          )}
        </div>
        {collectionValue && !isLoadingValue && !valueError && (
          <div className={styles.statSubtext}>
            Range: {formatCurrency(collectionValue.minimum)} -{" "}
            {formatCurrency(collectionValue.maximum)}
          </div>
        )}
      </div>

      <div className={styles.statCard}>
        <div className={styles.statLabel}>Total Releases</div>
        <div className={styles.statValueContainer}>
          <div className={styles.statValue}>
            {formatNumber(stats.totalReleases)}
          </div>
          {yearOverYearChange && (
            <div
              className={`${styles.yearOverYear} ${
                yearOverYearChange.isPositive
                  ? styles.positive
                  : styles.negative
              }`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.arrowIcon}
              >
                {yearOverYearChange.isPositive ? (
                  <path d="M6 2L10 6H7V10H5V6H2L6 2Z" fill="currentColor" />
                ) : (
                  <path d="M6 10L2 6H5V2H7V6H10L6 10Z" fill="currentColor" />
                )}
              </svg>
              <span className={styles.percentage}>
                {yearOverYearChange.percentage.toFixed(1)}%
              </span>
              <span className={styles.yearOverYearLabel}>vs last year</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statLabel}>Unique Artists</div>
        <div className={styles.statValue}>
          {formatNumber(stats.uniqueArtists)}
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statLabel}>Average Rating</div>
        <div className={styles.statValue}>
          {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
        </div>
        {stats.averageRating > 0 && (
          <div className={styles.statSubtext}>out of 5</div>
        )}
      </div>
    </div>
  );
}
