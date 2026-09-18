"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import classNames from "classnames";
import {
  formatUserTrackListenTooltip,
  type UserTrackStatCounts,
} from "src/utils/userTrack";
import styles from "./ReleaseTracklist.module.css";
import tooltipStyles from "./ReleaseTracklistListenStat.module.css";

interface ReleaseTracklistListenStatProps {
  label: string;
  stats: UserTrackStatCounts;
}

export const ReleaseTracklistListenStat = ({
  label,
  stats,
}: ReleaseTracklistListenStatProps) => (
  <Tooltip.Root>
    <Tooltip.Trigger
      className={classNames(styles.trackStats, tooltipStyles.trigger)}
      data-testid="fmdReleaseTracklistListenStat"
    >
      {label}
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Positioner
        align="end"
        className={tooltipStyles.positioner}
        side="top"
      >
        <Tooltip.Popup className={tooltipStyles.popup}>
          {formatUserTrackListenTooltip(stats)}
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>
);
