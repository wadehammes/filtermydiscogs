"use client";

import classNames from "classnames";
import { IconButton } from "src/components/IconButton/IconButton.component";
import {
  SegmentedControl,
  segmentedStyles,
} from "src/components/SegmentedControl/SegmentedControl.component";

export type StyleGenreViewMode = "cumulative" | "share";

interface StyleGenreViewToggleProps {
  viewMode: StyleGenreViewMode;
  onChange: (mode: StyleGenreViewMode) => void;
}

export const StyleGenreViewToggle = ({
  viewMode,
  onChange,
}: StyleGenreViewToggleProps) => (
  <SegmentedControl legend="Style in genre chart view">
    <IconButton
      className={classNames(segmentedStyles.segment, {
        [segmentedStyles.active]: viewMode === "cumulative",
      })}
      label="Total"
      onClick={() => onChange("cumulative")}
      aria-pressed={viewMode === "cumulative"}
    />
    <IconButton
      className={classNames(segmentedStyles.segment, {
        [segmentedStyles.active]: viewMode === "share",
      })}
      label="Share"
      onClick={() => onChange("share")}
      aria-pressed={viewMode === "share"}
    />
  </SegmentedControl>
);
