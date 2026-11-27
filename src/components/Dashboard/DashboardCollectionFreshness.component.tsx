"use client";

import styles from "./DashboardCollectionFreshness.module.css";

interface DashboardCollectionFreshnessProps {
  label: string | null;
}

export const DashboardCollectionFreshness = ({
  label,
}: DashboardCollectionFreshnessProps) => {
  if (!label) {
    return null;
  }

  return (
    <p className={styles.freshness} role="status">
      {label}
    </p>
  );
};
