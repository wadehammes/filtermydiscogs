"use client";

import classNames from "classnames";
import type { MouseEvent } from "react";
import { ReleaseNotesCardAction } from "src/components/ReleaseNotes/ReleaseNotesCardAction.component";
import { useReleaseNotesEditorContext } from "src/components/ReleaseNotes/ReleaseNotesEditor.context";
import { Spinner } from "src/components/Spinner/Spinner.component";
import { useCrate } from "src/context/crate.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import ExternalLinkIcon from "src/styles/icons/external-link-thin.svg";
import { ListPlusThinIcon } from "src/styles/icons/ListPlusThinIcon.component";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import { VinylThinIcon } from "src/styles/icons/VinylThinIcon.component";
import segmentedStyles from "src/styles/modules/segmented-control.module.css";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseCard.module.css";
import { useReleaseCardQueueAction } from "./useReleaseCardQueueAction.hook";

interface ReleaseCardOverlayActionsProps {
  release: DiscogsRelease;
  releaseUrl: string | null;
  onReleaseOpen?: () => void;
  notesVariant?: "card" | "mobile";
  layout?: "horizontal" | "vertical";
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
  const { addToCrate, removeFromCrate, isInCrate, openDrawer } = useCrate();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const isVertical = layout === "vertical";
  const useMobileTapPadding = isVertical && notesVariant === "mobile";
  const slotClass = isVertical
    ? classNames(stackStyles.overlayActionSlot, {
        [stackStyles.overlayActionSlotMobile]: useMobileTapPadding,
      })
    : styles.segmentSlot;
  const inCrate = isInCrate(release.instance_id);
  const { handleAddToQueue, isReleaseInQueue, isAdding, isFetchingRelease } =
    useReleaseCardQueueAction(release);

  const actionClass = (active = false) =>
    isVertical
      ? classNames(stackStyles.overlayAction, {
          [stackStyles.overlayActionMobile]: useMobileTapPadding,
        })
      : classNames(segmentedStyles.segment, styles.actionSegment, {
          [segmentedStyles.active]: active,
        });

  const handleCrateToggle = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (inCrate) {
      removeFromCrate(release.instance_id);
      return;
    }

    addToCrate(release);
    if (!isMobile) {
      openDrawer();
    }
  };

  const handleReleaseOpen = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onReleaseOpen?.();
  };

  const crateTooltipLabel = inCrate ? "Remove from Crate" : "Add to Crate";

  const crateAction = (
    <div className={isVertical ? slotClass : styles.segmentSlot}>
      <button
        type="button"
        className={isVertical ? actionClass(inCrate) : styles.crateActionButton}
        onClick={handleCrateToggle}
        aria-pressed={inCrate}
        aria-label={inCrate ? "Remove from crate" : "Add to crate"}
        title={crateTooltipLabel}
      >
        {inCrate ? (
          <MinusIcon className={stackStyles.actionIcon} />
        ) : (
          <PlusIcon className={stackStyles.actionIcon} />
        )}
      </button>
      {!isVertical ? (
        <span className={styles.tooltip}>{crateTooltipLabel}</span>
      ) : null}
    </div>
  );

  if (isDialogOpen) {
    return null;
  }

  const releaseDetailsAction = onReleaseOpen ? (
    <div className={slotClass}>
      <button
        type="button"
        className={actionClass()}
        onClick={handleReleaseOpen}
        aria-label="Open release details"
        title="Release details"
      >
        <VinylThinIcon className={stackStyles.actionIcon} aria-hidden />
      </button>
      {!isVertical ? (
        <span className={styles.tooltip}>Release details</span>
      ) : null}
    </div>
  ) : null;

  const queueAction = (
    <div className={slotClass}>
      <button
        type="button"
        className={actionClass()}
        onClick={handleAddToQueue}
        disabled={isReleaseInQueue || isAdding || isFetchingRelease}
        aria-label={
          isReleaseInQueue
            ? `${release.basic_information.title} is already in the queue`
            : `Add ${release.basic_information.title} to queue`
        }
        title={isReleaseInQueue ? "In queue" : "Add to queue"}
        data-testid="fmdReleaseCardAddToQueueButton"
      >
        <span className={styles.queueIconWrap}>
          {isFetchingRelease ? (
            <Spinner
              size="xs"
              className={stackStyles.actionIcon}
              aria-label="Loading release"
            />
          ) : (
            <ListPlusThinIcon className={stackStyles.actionIcon} aria-hidden />
          )}
          {isReleaseInQueue ? (
            <span
              className={styles.queueIndicatorDot}
              data-testid="fmdReleaseQueueIndicator"
              aria-hidden="true"
            />
          ) : null}
        </span>
      </button>
      {!isVertical ? (
        <span className={styles.tooltip}>
          {isReleaseInQueue ? "In queue" : "Add to queue"}
        </span>
      ) : null}
    </div>
  );

  const discogsAction = releaseUrl ? (
    <div className={slotClass}>
      <a
        href={releaseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={actionClass()}
        onClick={(event) => {
          event.stopPropagation();
        }}
        aria-label="View on Discogs"
        title="View on Discogs"
      >
        <ExternalLinkIcon className={stackStyles.actionIcon} />
      </a>
      {!isVertical ? (
        <span className={styles.tooltip}>View on Discogs</span>
      ) : null}
    </div>
  ) : null;

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
      <div
        className={classNames(
          segmentedStyles.container,
          segmentedStyles.containerAllowOverflow,
          styles.actionSegmented,
          className,
        )}
      >
        {releaseDetailsAction}
        {queueAction}
        <ReleaseNotesCardAction {...definedProps({ variant: notesVariant })} />
        {discogsAction}
      </div>
      {crateAction}
    </div>
  );
};
