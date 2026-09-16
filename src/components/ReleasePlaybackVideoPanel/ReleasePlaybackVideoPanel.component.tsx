"use client";

import classNames from "classnames";
import { type ReactNode, useEffect, useRef } from "react";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { useDraggablePanel } from "src/hooks/useDraggablePanel.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { RestorePanelLayoutThinIcon } from "src/styles/icons/RestorePanelLayoutThinIcon.component";
import XIcon from "src/styles/icons/x-thin.svg";
import type { VideoPanelResizeCorner } from "src/utils/videoPanelCornerResize";
import { VIDEO_PANEL_LAYOUT_STORAGE_KEY } from "src/utils/videoPanelLayoutStorage";
import styles from "./ReleasePlaybackVideoPanel.module.css";

const DESKTOP_VIDEO_RESIZE_CORNERS: VideoPanelResizeCorner[] = [
  "ne",
  "sw",
  "se",
];

const RESIZE_CORNER_ARIA_LABEL: Record<VideoPanelResizeCorner, string> = {
  nw: "Resize video panel from top-left corner",
  ne: "Resize video panel from top-right corner",
  sw: "Resize video panel from bottom-left corner",
  se: "Resize video panel from bottom-right corner",
};

const VIDEO_CORNER_RESIZE_CLASS: Partial<
  Record<VideoPanelResizeCorner, string>
> = {
  ne: styles.resizeHandleNE,
  sw: styles.resizeHandleSW,
  se: styles.resizeHandleSE,
};

interface ReleasePlaybackVideoPanelProps {
  panelId: string;
  isExpanded: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export const ReleasePlaybackVideoPanel = ({
  panelId,
  isExpanded,
  onClose,
  children,
}: ReleasePlaybackVideoPanelProps) => {
  const isMobileLayout = useMediaQuery("(max-width: 768px)");
  const {
    panelRef,
    position,
    scale,
    isDragging,
    isResizing,
    handlePointerDown,
    handleResizePointerDown,
    clearFloatingPosition,
    resetLayout,
  } = useDraggablePanel({
    enabled: isExpanded && !isMobileLayout,
    storageKey: VIDEO_PANEL_LAYOUT_STORAGE_KEY,
  });

  const wasMobileLayoutRef = useRef(isMobileLayout);

  useEffect(() => {
    if (wasMobileLayoutRef.current === isMobileLayout) {
      return;
    }

    clearFloatingPosition();
    wasMobileLayoutRef.current = isMobileLayout;
  }, [clearFloatingPosition, isMobileLayout]);

  const isInteracting = isDragging || isResizing;
  const useFloatingLayout = !isMobileLayout;

  const renderResizeHandle = (
    corner: VideoPanelResizeCorner,
    placement: "chrome" | "video" = "video",
  ) => (
    <button
      key={`${placement}-${corner}`}
      type="button"
      className={classNames(
        placement === "chrome"
          ? styles.panelChromeNwResize
          : styles.resizeHandle,
        VIDEO_CORNER_RESIZE_CLASS[corner],
      )}
      onPointerDown={handleResizePointerDown(corner)}
      aria-label={RESIZE_CORNER_ARIA_LABEL[corner]}
      data-testid="fmdReleasePlaybackVideoPanelResizeHandle"
      data-resize-corner={corner}
    />
  );

  return (
    <div
      ref={panelRef}
      id={panelId}
      className={classNames(styles.videoPanel, {
        [styles.videoPanelPositioned]:
          useFloatingLayout && (position !== null || isInteracting),
        [styles.videoPanelDragging]: isInteracting,
      })}
      {...(isExpanded ? { "data-video-expanded": "true" as const } : {})}
      style={{
        ...(useFloatingLayout && position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
            }
          : {}),
        ...(isExpanded && useFloatingLayout
          ? {
              ["--panel-scale" as string]: String(scale),
            }
          : {}),
      }}
      data-testid="fmdReleasePlaybackVideoPanel"
    >
      {isExpanded && (onClose || useFloatingLayout) ? (
        <div
          className={classNames(styles.panelChrome, {
            [styles.panelChromeMobile]: !useFloatingLayout,
            [styles.panelChromeDraggable]: useFloatingLayout,
          })}
          {...(useFloatingLayout
            ? {
                onPointerDown: handlePointerDown,
                onDoubleClick: resetLayout,
                "aria-label":
                  "Drag video panel. Double-click or use Reset to restore default position and size.",
                "data-testid": "fmdReleasePlaybackVideoPanelHandle",
              }
            : {})}
        >
          {useFloatingLayout ? renderResizeHandle("nw", "chrome") : null}
          {useFloatingLayout ? (
            <span className={styles.dragHandleGrip} aria-hidden />
          ) : null}
          {useFloatingLayout || onClose ? (
            <div className={styles.panelChromeActions}>
              {useFloatingLayout ? (
                <IconButton
                  className={styles.panelChromeButton}
                  onClick={resetLayout}
                  aria-label="Reset video panel position and size"
                  data-testid="fmdReleasePlaybackVideoPanelResetButton"
                >
                  <RestorePanelLayoutThinIcon />
                </IconButton>
              ) : null}
              {onClose ? (
                <IconButton
                  variant="close"
                  className={styles.panelChromeButton}
                  onClick={onClose}
                  aria-label="Close video panel"
                  data-testid="fmdReleasePlaybackVideoPanelCloseButton"
                >
                  <XIcon />
                </IconButton>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <div
        className={classNames(styles.videoContent, {
          [styles.videoContentInteractive]: isExpanded && !isInteracting,
        })}
      >
        {children}
        {isExpanded && useFloatingLayout
          ? DESKTOP_VIDEO_RESIZE_CORNERS.map((corner) =>
              renderResizeHandle(corner),
            )
          : null}
      </div>
    </div>
  );
};
