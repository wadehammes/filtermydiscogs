"use client";

import { EmptyState } from "src/components/EmptyState/EmptyState.component";
import type { DuplicateGroup } from "src/types/dashboard.types";
import { definedProps } from "src/utils/definedProps";
import { DashboardReleaseItem } from "./DashboardReleaseItem.component";
import styles from "./DuplicatesList.module.css";

interface DuplicatesListProps {
  duplicateGroups: DuplicateGroup[];
  onReleaseClick?: (instanceId: string) => void;
}

export function DuplicatesList({
  duplicateGroups,
  onReleaseClick,
}: DuplicatesListProps) {
  if (duplicateGroups.length === 0) {
    return (
      <EmptyState
        variant="inline"
        title="Nothing here — shelf looks clean."
        className={styles.emptyState}
      />
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
                <DashboardReleaseItem
                  release={release}
                  {...definedProps({ onReleaseClick })}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
