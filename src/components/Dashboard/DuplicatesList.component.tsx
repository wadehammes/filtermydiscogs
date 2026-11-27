"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { DashboardDrilldownFacetControl } from "src/components/Dashboard/DashboardDrilldownFacetControl.component";
import { EmptyState } from "src/components/EmptyState/EmptyState.component";
import { DUPLICATES_EMPTY_TITLE } from "src/constants/dashboardCopy.constants";
import drilldownStyles from "src/styles/modules/dashboard-drilldown.module.css";
import type { DuplicateGroup } from "src/types/dashboard.types";
import {
  buildDuplicateGroupDrilldownTarget,
  type DashboardDrilldownTarget,
} from "src/utils/dashboardDrilldownFilters";
import { definedProps } from "src/utils/definedProps";
import { DashboardReleaseItem } from "./DashboardReleaseItem.component";
import styles from "./DuplicatesList.module.css";

interface DuplicatesListProps {
  duplicateGroups: DuplicateGroup[];
  onDrilldown?: (target: DashboardDrilldownTarget) => void;
  onReleaseClick?: (instanceId: string) => void;
}

export const DuplicatesList = ({
  duplicateGroups,
  onDrilldown,
  onReleaseClick,
}: DuplicatesListProps) => {
  if (duplicateGroups.length === 0) {
    return (
      <EmptyState
        variant="inline"
        title={DUPLICATES_EMPTY_TITLE}
        className={styles.emptyState}
      />
    );
  }

  return (
    <Tooltip.Provider closeDelay={80} delay={300}>
      <div className={styles.duplicatesList}>
        {duplicateGroups.map((group) => {
          const groupDrilldownTarget = onDrilldown
            ? buildDuplicateGroupDrilldownTarget(group)
            : null;

          return (
            <div key={group.key} className={styles.duplicateGroup}>
              <div className={styles.groupHeader}>
                <span className={styles.groupType}>
                  {group.type === "master_id" ? "Exact" : "Potential"} Duplicate
                </span>
                <span className={styles.groupCount}>
                  {group.releases.length} releases
                </span>
                {groupDrilldownTarget ? (
                  <DashboardDrilldownFacetControl
                    className={drilldownStyles.chip}
                    filterLabel={
                      group.releases[0]?.basic_information.title ?? "duplicates"
                    }
                    onPress={() => onDrilldown?.(groupDrilldownTarget)}
                  >
                    View in collection
                  </DashboardDrilldownFacetControl>
                ) : null}
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
          );
        })}
      </div>
    </Tooltip.Provider>
  );
};
