"use client";

import classNames from "classnames";
import { segmentedStyles } from "src/components/SegmentedControl/SegmentedControl.component";
import tableRowActionStyles from "src/styles/modules/table-row-actions.module.css";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";
import styles from "./ReleaseCard.module.css";

type ReleaseCardOverlayLayout = "horizontal" | "vertical" | "table";
type ReleaseCardNotesVariant = "card" | "mobile" | "table";

interface UseReleaseCardOverlayLayoutParams {
  layout: ReleaseCardOverlayLayout;
  notesVariant: ReleaseCardNotesVariant;
}

export const useReleaseCardOverlayLayout = ({
  layout,
  notesVariant,
}: UseReleaseCardOverlayLayoutParams) => {
  const isTable = layout === "table";
  const isVertical = layout === "vertical";
  const useMobileTapPadding = isVertical && notesVariant === "mobile";

  const slotClass = isVertical
    ? classNames(stackStyles.overlayActionSlot, {
        [stackStyles.overlayActionSlotMobile]: useMobileTapPadding,
      })
    : styles.segmentSlot;

  const actionClass = (active = false) => {
    if (isTable) {
      return tableRowActionStyles.actionButton;
    }

    return isVertical
      ? classNames(stackStyles.overlayAction, {
          [stackStyles.overlayActionMobile]: useMobileTapPadding,
        })
      : classNames(segmentedStyles.segment, styles.actionSegment, {
          [segmentedStyles.active]: active,
        });
  };

  return {
    isTable,
    isVertical,
    slotClass,
    actionClass,
  };
};
