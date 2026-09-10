"use client";

import classNames from "classnames";
import type { MouseEvent } from "react";
import { DiscogsExternalLink } from "src/components/DiscogsExternalLink/DiscogsExternalLink.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { ReleaseNotesCardAction } from "src/components/ReleaseNotes/ReleaseNotesCardAction.component";
import { useReleaseNotesEditorContext } from "src/components/ReleaseNotes/ReleaseNotesEditor.context";
import {
  SegmentedControl,
  segmentedStyles,
} from "src/components/SegmentedControl/SegmentedControl.component";
import { Spinner } from "src/components/Spinner/Spinner.component";
import { ListPlusThinIcon } from "src/styles/icons/ListPlusThinIcon.component";
import { VinylThinIcon } from "src/styles/icons/VinylThinIcon.component";
import tableRowActionStyles from "src/styles/modules/table-row-actions.module.css";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseCard.module.css";
import { ReleaseCrateMenu } from "./ReleaseCrateMenu.component";
import { useReleaseCardQueueAction } from "./useReleaseCardQueueAction.hook";

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
  const isTable = layout === "table";
  const isVertical = layout === "vertical";
  const useMobileTapPadding = isVertical && notesVariant === "mobile";
  const slotClass = isVertical
    ? classNames(stackStyles.overlayActionSlot, {
        [stackStyles.overlayActionSlotMobile]: useMobileTapPadding,
      })
    : styles.segmentSlot;
  const { handleAddToQueue, isReleaseInQueue, isAdding, isFetchingRelease } =
    useReleaseCardQueueAction(release);

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
    releaseDetailsButton == null ? null : isTable ? (
      releaseDetailsButton
    ) : (
      <div className={slotClass}>
        {releaseDetailsButton}
        {!isVertical ? (
          <span className={styles.tooltip}>Release details</span>
        ) : null}
      </div>
    );

  const queueButton = (
    <IconButton
      variant="queue"
      className={actionClass()}
      iconClassName={styles.queueIconWrap}
      onClick={handleAddToQueue}
      disabled={isReleaseInQueue || isAdding || isFetchingRelease}
      aria-label={
        isReleaseInQueue
          ? `${release.basic_information.title} is already in the queue`
          : `Add ${release.basic_information.title} to queue`
      }
      title={isReleaseInQueue ? "In queue" : "Add to queue"}
      data-testid={
        isTable
          ? "fmdReleaseTableAddToQueueButton"
          : "fmdReleaseCardAddToQueueButton"
      }
    >
      {isFetchingRelease ? (
        <Spinner
          size="xs"
          className={stackStyles.actionIcon}
          aria-label="Loading release"
        />
      ) : (
        <ListPlusThinIcon className={stackStyles.actionIcon} />
      )}
      {isReleaseInQueue ? (
        <span
          className={styles.queueIndicatorDot}
          data-testid="fmdReleaseQueueIndicator"
          aria-hidden="true"
        />
      ) : null}
    </IconButton>
  );

  const queueAction = isTable ? (
    queueButton
  ) : (
    <div className={slotClass}>
      {queueButton}
      {!isVertical ? (
        <span className={styles.tooltip}>
          {isReleaseInQueue ? "In queue" : "Add to queue"}
        </span>
      ) : null}
    </div>
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
    discogsLink == null ? null : isTable ? (
      discogsLink
    ) : (
      <div className={slotClass}>
        {discogsLink}
        {!isVertical ? (
          <span className={styles.tooltip}>View on Discogs</span>
        ) : null}
      </div>
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
