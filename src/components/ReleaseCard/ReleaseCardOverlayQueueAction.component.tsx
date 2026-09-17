"use client";

import { IconButton } from "src/components/IconButton/IconButton.component";
import { Spinner } from "src/components/Spinner/Spinner.component";
import { ListPlusThinIcon } from "src/styles/icons/ListPlusThinIcon.component";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";
import type { DiscogsRelease } from "src/types";
import styles from "./ReleaseCard.module.css";
import { ReleaseCardOverlayActionSlot } from "./ReleaseCardOverlayActionSlot.component";
import { useReleaseCardQueueAction } from "./useReleaseCardQueueAction.hook";

interface ReleaseCardOverlayQueueActionProps {
  release: DiscogsRelease;
  isTable: boolean;
  isVertical: boolean;
  slotClass: string;
  actionClass: (active?: boolean) => string;
}

export const ReleaseCardOverlayQueueAction = ({
  release,
  isTable,
  isVertical,
  slotClass,
  actionClass,
}: ReleaseCardOverlayQueueActionProps) => {
  const { handleAddToQueue, isReleaseInQueue, isAdding, isFetchingRelease } =
    useReleaseCardQueueAction(release);

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

  return (
    <ReleaseCardOverlayActionSlot
      isTable={isTable}
      isVertical={isVertical}
      slotClass={slotClass}
      tooltip={isReleaseInQueue ? "In queue" : "Add to queue"}
      tooltipClassName={styles.tooltip}
    >
      {queueButton}
    </ReleaseCardOverlayActionSlot>
  );
};
