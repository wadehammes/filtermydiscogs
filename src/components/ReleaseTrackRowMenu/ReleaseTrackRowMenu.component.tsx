"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import { useCallback, useRef } from "react";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
import { ListPlusThinIcon } from "src/styles/icons/ListPlusThinIcon.component";
import MenuIcon from "src/styles/icons/menu-thin.svg";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import { VideoThinIcon } from "src/styles/icons/VideoThinIcon.component";
import styles from "./ReleaseTrackRowMenu.module.css";

export type ReleaseTrackRowMenuProps = {
  trackTitle: string;
  className?: string | undefined;
  triggerClassName?: string | undefined;
  canAddToQueue: boolean;
  canUnqueue: boolean;
  isQueued: boolean;
  hasUserYoutubeOverride: boolean;
  hasDefaultYoutubeEmbed: boolean;
  onAddToQueue?: () => void;
  onRemoveFromQueue?: () => void;
  onEditYoutube?: () => void;
  useMenuOverlayStack?: boolean;
  releaseHasQueueActions?: boolean;
};

export const ReleaseTrackRowMenu = ({
  trackTitle,
  className,
  triggerClassName,
  canAddToQueue,
  canUnqueue,
  isQueued,
  hasUserYoutubeOverride,
  hasDefaultYoutubeEmbed,
  onAddToQueue,
  onRemoveFromQueue,
  onEditYoutube,
  useMenuOverlayStack = true,
  releaseHasQueueActions = false,
}: ReleaseTrackRowMenuProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      queueMicrotask(() => {
        triggerRef.current?.blur();
      });
    }
  }, []);

  const showAddToQueue = onAddToQueue !== undefined && canAddToQueue;
  const showRemoveFromQueue = onRemoveFromQueue !== undefined && canUnqueue;
  const showInQueueDisabled =
    isQueued && !canAddToQueue && !canUnqueue && releaseHasQueueActions;
  const showAddToQueueUnavailable =
    releaseHasQueueActions &&
    !canAddToQueue &&
    !isQueued &&
    !canUnqueue &&
    onAddToQueue === undefined;
  const showYoutube = onEditYoutube !== undefined;
  const hasItems =
    showAddToQueue ||
    showRemoveFromQueue ||
    showInQueueDisabled ||
    showAddToQueueUnavailable ||
    showYoutube;

  if (!hasItems) {
    return null;
  }

  const youtubeLabel = hasUserYoutubeOverride
    ? "Edit YouTube URL"
    : hasDefaultYoutubeEmbed
      ? "Use different video"
      : "Add YouTube URL";

  return (
    <div
      className={classNames(styles.menuRoot, className)}
      data-testid="fmdReleaseTrackRowMenu"
    >
      <Menu.Root onOpenChange={handleOpenChange} modal={false}>
        <Menu.Trigger
          render={(props) => (
            <IconButton
              {...props}
              ref={(node) => {
                triggerRef.current = node;
                if (typeof props.ref === "function") {
                  props.ref(node);
                } else if (props.ref) {
                  props.ref.current = node;
                }
              }}
              variant="queue"
              className={classNames(styles.menuTrigger, triggerClassName, {
                [styles.menuTriggerQueued]: hasUserYoutubeOverride,
              })}
              iconClassName={styles.menuTriggerIcon}
              aria-label={`Actions for ${trackTitle}`}
              data-testid="fmdReleaseTrackRowMenuTrigger"
              onClick={(event) => {
                event.stopPropagation();
                props.onClick?.(event);
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
        />
        <InlinePopoverMenu.Panel
          align="end"
          side="bottom"
          popupClassName={styles.menuPopup}
          testId="fmdReleaseTrackRowMenuPanel"
          useOverlayStack={useMenuOverlayStack}
        >
          <InlinePopoverMenu.List>
            {showAddToQueue ? (
              <InlinePopoverMenu.Item
                onClick={() => {
                  onAddToQueue();
                }}
              >
                <span className={styles.menuItemIcon} aria-hidden>
                  <ListPlusThinIcon />
                </span>
                <span className={styles.menuItemLabel}>Add to queue</span>
              </InlinePopoverMenu.Item>
            ) : null}
            {showRemoveFromQueue ? (
              <InlinePopoverMenu.Item
                onClick={() => {
                  onRemoveFromQueue();
                }}
              >
                <span className={styles.menuItemIcon} aria-hidden>
                  <MinusIcon />
                </span>
                <span className={styles.menuItemLabel}>Remove from queue</span>
              </InlinePopoverMenu.Item>
            ) : null}
            {showInQueueDisabled ? (
              <InlinePopoverMenu.Item disabled>
                <span className={styles.menuItemIcon} aria-hidden>
                  <CheckThinIcon />
                </span>
                <span className={styles.menuItemLabel}>In queue</span>
              </InlinePopoverMenu.Item>
            ) : null}
            {showAddToQueueUnavailable ? (
              <InlinePopoverMenu.Item disabled>
                <span className={styles.menuItemIcon} aria-hidden>
                  <ListPlusThinIcon />
                </span>
                <span className={styles.menuItemLabel}>Add to queue</span>
              </InlinePopoverMenu.Item>
            ) : null}
            {showYoutube ? (
              <InlinePopoverMenu.Item
                onClick={() => {
                  onEditYoutube();
                }}
              >
                <span className={styles.menuItemIcon} aria-hidden>
                  <VideoThinIcon />
                </span>
                <span className={styles.menuItemLabel}>{youtubeLabel}</span>
              </InlinePopoverMenu.Item>
            ) : null}
          </InlinePopoverMenu.List>
        </InlinePopoverMenu.Panel>
      </Menu.Root>
    </div>
  );
};
