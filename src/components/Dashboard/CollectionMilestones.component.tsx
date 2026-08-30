"use client";

import classNames from "classnames";
import { type CSSProperties, useMemo } from "react";
import { DashboardReleaseItem } from "src/components/Dashboard/DashboardReleaseItem.component";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useScrollRevealInView } from "src/hooks/useScrollRevealInView.hook";
import { definedProps } from "src/utils/definedProps";
import {
  calculateMilestones,
  sortMilestonesChronologically,
} from "src/utils/milestones";
import styles from "./CollectionMilestones.module.css";

interface CollectionMilestonesProps {
  hideHeading?: boolean;
  onReleaseClick?: (instanceId: string) => void;
}

const getMilestoneMarker = (value: string): string => {
  const [firstPart] = value.split("•");
  return firstPart?.trim() ?? value;
};

export function CollectionMilestones({
  hideHeading = false,
  onReleaseClick,
}: CollectionMilestonesProps) {
  const releases = useAllReleases();
  const { ref, inView } = useScrollRevealInView();

  const milestones = useMemo(() => {
    return sortMilestonesChronologically(calculateMilestones(releases || []));
  }, [releases]);

  if (milestones.length === 0) {
    return (
      <div className={styles.container}>
        {!hideHeading && <h2>Collection Milestones</h2>}
        <div className={styles.emptyState}>
          <p>Milestones appear here as the shelf grows.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {!hideHeading && <h2>Collection Milestones</h2>}
      <div
        ref={ref}
        aria-busy={!inView ? true : undefined}
        className={styles.zigzagTrack}
      >
        {inView ? (
          <div className={styles.zigzagScroller}>
            <ol
              aria-label="Collection milestones in chronological order"
              className={styles.zigzagList}
            >
              {milestones.map((milestone, index) => {
                const isTop = index % 2 === 0;
                const marker = getMilestoneMarker(milestone.value);
                const revealStyle = {
                  "--reveal-index": index,
                } as CSSProperties;

                const card = (
                  <article className={styles.zigzagCard}>
                    <header className={styles.zigzagCardHeader}>
                      <h3 className={styles.zigzagLabel}>{milestone.label}</h3>
                      <p className={styles.zigzagMarker}>{marker}</p>
                      {milestone.description && (
                        <p className={styles.zigzagDescription}>
                          {milestone.description}
                        </p>
                      )}
                    </header>
                    {milestone.release && (
                      <div className={styles.zigzagRelease}>
                        <DashboardReleaseItem
                          release={milestone.release}
                          {...definedProps({ onReleaseClick })}
                        />
                      </div>
                    )}
                  </article>
                );

                return (
                  <li
                    key={`${milestone.label}-${milestone.release?.instance_id ?? milestone.value}`}
                    className={classNames(styles.zigzagItem, {
                      [styles.zigzagItemTop]: isTop,
                      [styles.zigzagItemBottom]: !isTop,
                    })}
                    style={revealStyle}
                  >
                    {isTop ? (
                      card
                    ) : (
                      <div aria-hidden="true" className={styles.zigzagSpacer} />
                    )}

                    <div className={styles.zigzagNode}>
                      <span aria-hidden="true" className={styles.zigzagStem} />
                      <span aria-hidden="true" className={styles.zigzagDot} />
                    </div>

                    {isTop ? (
                      <div aria-hidden="true" className={styles.zigzagSpacer} />
                    ) : (
                      card
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : (
          <div className={styles.timelinePlaceholder} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
