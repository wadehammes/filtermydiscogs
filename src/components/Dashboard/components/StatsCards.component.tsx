"use client";

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
        <div className={styles.statValue}>
          {formatNumber(stats.totalReleases)}
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
