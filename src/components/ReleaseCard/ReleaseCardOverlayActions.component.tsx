"use client";

import classNames from "classnames";
import type { MouseEvent } from "react";
import { DiscogsExternalLink } from "src/components/DiscogsExternalLink/DiscogsExternalLink.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { ReleaseNotesCardAction } from "src/components/ReleaseNotes/ReleaseNotesCardAction.component";
import { useReleaseNotesEditorContext } from "src/components/ReleaseNotes/ReleaseNotesEditor.context";
import { SegmentedControl } from "src/components/SegmentedControl/SegmentedControl.component";
import { VinylThinIcon } from "src/styles/icons/VinylThinIcon.component";
import tableRowActionStyles from "src/styles/modules/table-row-actions.module.css";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseCard.module.css";
import { ReleaseCardOverlayActionSlot } from "./ReleaseCardOverlayActionSlot.component";
import { ReleaseCardOverlayQueueAction } from "./ReleaseCardOverlayQueueAction.component";
import { ReleaseCrateMenu } from "./ReleaseCrateMenu.component";
import { useReleaseCardOverlayLayout } from "./useReleaseCardOverlayLayout.hook";

interface ReleaseCardOverlayActionsProps {
  release: DiscogsRelease;
  releaseUrl: string | null;
  onReleaseOpen?: () => void;
  notesVariant?: "card" | "mobile" | "table";
  layout?: "horizontal" | "vertical" | "table";
  className?: string | undefined;
}

export const ReleaseCardOverlayActions = ({
  release,
  releaseUrl,
  onReleaseOpen,
  notesVariant = "card",
  layout = "horizontal",
  className,
}: ReleaseCardOverlayActionsProps) => {
  const { isDialogOpen } = useReleaseNotesEditorContext();
  const { isTable, isVertical, slotClass, actionClass } =
    useReleaseCardOverlayLayout({ layout, notesVariant });

  const crateAction = isTable ? null : (
    <ReleaseCrateMenu
      release={release}
      layout={isVertical ? "vertical" : "horizontal"}
      actionClass={actionClass}
      slotClass={slotClass}
    />
  );

  if (isDialogOpen) {
    return null;
  }

  const handleReleaseOpen = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onReleaseOpen?.();
  };

  const releaseDetailsButton = onReleaseOpen ? (
    <IconButton
      className={actionClass()}
      iconClassName={stackStyles.actionIcon}
      onClick={handleReleaseOpen}
      aria-label="Open release details"
      title="Release details"
    >
      <VinylThinIcon />
    </IconButton>
  ) : null;

  const releaseDetailsAction =
    releaseDetailsButton == null ? null : (
      <ReleaseCardOverlayActionSlot
        isTable={isTable}
        isVertical={isVertical}
        slotClass={slotClass}
        tooltip="Release details"
        tooltipClassName={styles.tooltip}
      >
        {releaseDetailsButton}
      </ReleaseCardOverlayActionSlot>
    );

  const queueAction = (
    <ReleaseCardOverlayQueueAction
      release={release}
      isTable={isTable}
      isVertical={isVertical}
      slotClass={slotClass}
      actionClass={actionClass}
    />
  );

  const discogsLink = releaseUrl ? (
    <DiscogsExternalLink
      href={releaseUrl}
      variant="icon"
      className={actionClass()}
      iconClassName={stackStyles.actionIcon}
      onClick={(event) => {
        event.stopPropagation();
      }}
    />
  ) : null;

  const discogsAction =
    discogsLink == null ? null : (
      <ReleaseCardOverlayActionSlot
        isTable={isTable}
        isVertical={isVertical}
        slotClass={slotClass}
        tooltip="View on Discogs"
        tooltipClassName={styles.tooltip}
      >
        {discogsLink}
      </ReleaseCardOverlayActionSlot>
    );

  if (isTable) {
    return (
      <div
        className={classNames(tableRowActionStyles.actions, className)}
        data-testid="fmdReleasesTableRowActions"
      >
        {releaseDetailsAction}
        <ReleaseNotesCardAction {...definedProps({ variant: notesVariant })} />
        {queueAction}
        {discogsAction}
      </div>
    );
  }

  if (isVertical) {
    return (
      <div className={stackStyles.overlayActions}>
        {releaseDetailsAction}
        {queueAction}
        {notesVariant !== "mobile" ? (
          <ReleaseNotesCardAction
            {...definedProps({ variant: notesVariant })}
          />
        ) : null}
        {discogsAction}
        {crateAction}
      </div>
    );
  }

  return (
    <div className={styles.desktopOverlayActions}>
      <SegmentedControl
        legend="Release card actions"
        allowOverflow
        className={classNames(styles.actionSegmented, className)}
      >
        {releaseDetailsAction}
        {queueAction}
        <ReleaseNotesCardAction {...definedProps({ variant: notesVariant })} />
        {discogsAction}
      </SegmentedControl>
      {crateAction}
    </div>
  );
};
