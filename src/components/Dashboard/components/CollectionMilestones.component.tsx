"use client";

import { useMemo } from "react";
import { useCollectionContext } from "src/context/collection.context";
import { calculateMilestones } from "src/utils/milestones";
import styles from "./CollectionMilestones.module.css";
import { DashboardReleaseItem } from "./DashboardReleaseItem.component";

export function CollectionMilestones() {
  const { state: collectionState } = useCollectionContext();
  const { releases } = collectionState;

  const milestones = useMemo(() => {
    return calculateMilestones(releases || []);
  }, [releases]);

  if (milestones.length === 0) {
    return (
      <div className={styles.container}>
        <h2>Collection Milestones</h2>
        <div className={styles.emptyState}>
          <p>No milestones yet. Start adding releases to see your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Collection Milestones</h2>
      <div className={styles.milestonesList}>
        {milestones.map((milestone, index) => (
          <div key={index} className={styles.milestoneItem}>
            <div className={styles.milestoneHeader}>
              <div className={styles.milestoneLabel}>{milestone.label}</div>
              <div className={styles.milestoneValue}>{milestone.value}</div>
            </div>
            {milestone.release ? (
              <div className={styles.releaseWrapper}>
                <DashboardReleaseItem
                  release={milestone.release}
                  category="milestones"
                />
              </div>
            ) : (
              milestone.description && (
                <div className={styles.milestoneDescription}>
                  {milestone.description}
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
