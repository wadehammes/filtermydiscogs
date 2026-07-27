import classNames from "classnames";
import type { MouseEvent } from "react";
import { trackEvent } from "src/analytics/analytics";
import { ReleaseNotesCardAction } from "src/components/ReleaseNotes/ReleaseNotesCardAction.component";
import { useCrate } from "src/context/crate.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import ExternalLinkIcon from "src/styles/icons/external-link-thin.svg";
import MenuIcon from "src/styles/icons/menu-thin.svg";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import segmentedStyles from "src/styles/segmented-control.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseCard.module.css";

interface ReleaseCardOverlayActionsProps {
  release: DiscogsRelease;
  releaseUrl: string | null;
  resourceUrl: string | null;
  onReleaseOpen?: () => void;
  notesVariant?: "card" | "mobile";
  layout?: "horizontal" | "vertical";
  className?: string | undefined;
}

export const ReleaseCardOverlayActions = ({
  release,
  releaseUrl,
  resourceUrl,
  onReleaseOpen,
  notesVariant = "card",
  layout = "horizontal",
  className,
}: ReleaseCardOverlayActionsProps) => {
  const { addToCrate, removeFromCrate, isInCrate, openDrawer } = useCrate();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const isVertical = layout === "vertical";
  const slotClass = isVertical ? styles.overlayActionSlot : styles.segmentSlot;
  const inCrate = isInCrate(release.instance_id);

  const actionClass = (active = false) =>
    isVertical
      ? classNames(styles.overlayAction, {
          [styles.overlayActionActive]: active,
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

  return (
    <div
      className={classNames(
        isVertical ? styles.overlayActions : segmentedStyles.container,
        {
          [segmentedStyles.containerAllowOverflow]: !isVertical,
        },
        !isVertical && styles.actionSegmented,
        className,
      )}
    >
      {onReleaseOpen ? (
        <div className={slotClass}>
          <button
            type="button"
            className={actionClass()}
            onClick={handleReleaseOpen}
            aria-label="Open release details"
            title="Release details"
          >
            <MenuIcon className={styles.actionIcon} />
          </button>
          {!isVertical ? (
            <span className={styles.tooltip}>Release details</span>
          ) : null}
        </div>
      ) : null}
      {releaseUrl ? (
        <div className={slotClass}>
          <a
            href={releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={actionClass()}
            onClick={(event) => {
              event.stopPropagation();
              trackEvent("releaseClicked", {
                action: "releaseClicked",
                category: "releaseCard",
                label: "View on Discogs",
                value: resourceUrl ?? releaseUrl,
              });
            }}
            aria-label="View on Discogs"
            title="View on Discogs"
          >
            <ExternalLinkIcon className={styles.actionIcon} />
          </a>
          {!isVertical ? (
            <span className={styles.tooltip}>View on Discogs</span>
          ) : null}
        </div>
      ) : null}
      <ReleaseNotesCardAction {...definedProps({ variant: notesVariant })} />
      <div className={slotClass}>
        <button
          type="button"
          className={actionClass(inCrate)}
          onClick={handleCrateToggle}
          aria-label={inCrate ? "Remove from crate" : "Add to crate"}
          title={inCrate ? "Remove from Crate" : "Add to Crate"}
        >
          {inCrate ? (
            <MinusIcon className={styles.actionIcon} />
          ) : (
            <PlusIcon className={styles.actionIcon} />
          )}
        </button>
        {!isVertical ? (
          <span className={styles.tooltip}>
            {inCrate ? "Remove from Crate" : "Add to Crate"}
          </span>
        ) : null}
      </div>
    </div>
  );
};
