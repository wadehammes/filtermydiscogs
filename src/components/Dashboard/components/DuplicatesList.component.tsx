"use client";

import type { DuplicateGroup } from "src/types/dashboard.types";
import { DashboardReleaseItem } from "./DashboardReleaseItem.component";
import styles from "./DuplicatesList.module.css";

interface DuplicatesListProps {
  duplicateGroups: DuplicateGroup[];
}

export function DuplicatesList({ duplicateGroups }: DuplicatesListProps) {
  if (duplicateGroups.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No duplicates found in this category.</p>
      </div>
    );
  }

  return (
    <div className={styles.duplicatesList}>
      {duplicateGroups.map((group) => (
        <div key={group.key} className={styles.duplicateGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupType}>
              {group.type === "master_id" ? "Exact" : "Potential"} Duplicate
            </span>
            <span className={styles.groupCount}>
              {group.releases.length} releases
            </span>
          </div>
          <div className={styles.releasesList}>
            {group.releases.map((release) => (
              <div key={release.instance_id} className={styles.releaseItem}>
                <DashboardReleaseItem release={release} category="duplicates" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
