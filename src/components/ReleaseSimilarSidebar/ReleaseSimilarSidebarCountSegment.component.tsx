"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import classNames from "classnames";
import { segmentedStyles } from "src/components/SegmentedControl/SegmentedControl.component";
import {
  formatSimilarReleaseCountLabel,
  RELEASE_SIMILAR_COUNT_TOOLTIP,
} from "src/constants/releaseSimilarSidebar.constants";
import styles from "./ReleaseSimilarSidebar.module.css";

type ReleaseSimilarSidebarCountSegmentProps = {
  totalSimilarMatchCount: number;
  showPaginationDivider?: boolean;
};

export const ReleaseSimilarSidebarCountSegment = ({
  totalSimilarMatchCount,
  showPaginationDivider = false,
}: ReleaseSimilarSidebarCountSegmentProps) => (
  <div className={styles.similarCountTooltipRoot}>
    <Tooltip.Root>
      <Tooltip.Trigger
        className={classNames(
          segmentedStyles.segment,
          styles.sidebarSegment,
          styles.similarCountSegment,
          showPaginationDivider && styles.similarCountSegmentWithPageNav,
        )}
        data-testid="fmdReleaseSimilarSidebarCount"
      >
        {formatSimilarReleaseCountLabel(totalSimilarMatchCount)}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner
          align="start"
          className={styles.countTooltipPositioner}
          side="top"
        >
          <Tooltip.Popup className={styles.countTooltipPopup}>
            {RELEASE_SIMILAR_COUNT_TOOLTIP}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  </div>
);
