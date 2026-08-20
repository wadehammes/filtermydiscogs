"use client";

import classNames from "classnames";
import { type ReactNode, useEffect, useRef } from "react";
import { useDraggablePanel } from "src/hooks/useDraggablePanel.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import XIcon from "src/styles/icons/x-thin.svg";
import { VIDEO_PANEL_LAYOUT_STORAGE_KEY } from "src/utils/videoPanelLayoutStorage";
import styles from "./ReleasePlaybackVideoPanel.module.css";

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
    resetLayout,
  } = useDraggablePanel({
    enabled: isExpanded && !isMobileLayout,
    storageKey: VIDEO_PANEL_LAYOUT_STORAGE_KEY,
  });

  const wasMobileLayoutRef = useRef(isMobileLayout);

  useEffect(() => {
    if (wasMobileLayoutRef.current && !isMobileLayout && isExpanded) {
      resetLayout();
    }

    wasMobileLayoutRef.current = isMobileLayout;
  }, [isExpanded, isMobileLayout, resetLayout]);

  const isInteracting = isDragging || isResizing;
  const useFloatingLayout = !isMobileLayout;

  return (
    <div
      ref={panelRef}
      id={panelId}
      className={classNames(styles.videoPanel, {
        [styles.videoPanelExpanded]: isExpanded,
        [styles.videoPanelPositioned]: useFloatingLayout && position !== null,
        [styles.videoPanelDragging]: isInteracting,
      })}
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
      {isExpanded && isMobileLayout && onClose ? (
        <button
          type="button"
          className={styles.mobileCloseBar}
          onClick={onClose}
          aria-label="Close video panel"
          data-testid="fmdReleasePlaybackVideoPanelCloseButton"
        >
          <XIcon className={styles.mobileCloseIcon} aria-hidden />
        </button>
      ) : null}
      {isExpanded && useFloatingLayout ? (
        <button
          type="button"
          className={styles.dragHandle}
          onPointerDown={handlePointerDown}
          onDoubleClick={resetLayout}
          aria-label="Drag video panel. Double-click to reset position and size."
          data-testid="fmdReleasePlaybackVideoPanelHandle"
        >
          <span className={styles.dragHandleGrip} aria-hidden />
        </button>
      ) : null}
      <div
        className={classNames(styles.videoContent, {
          [styles.videoContentInteractive]: isExpanded && !isInteracting,
        })}
      >
        {children}
      </div>
      {isExpanded && useFloatingLayout ? (
        <button
          type="button"
          className={styles.resizeHandle}
          onPointerDown={handleResizePointerDown}
          aria-label="Resize video panel"
          data-testid="fmdReleasePlaybackVideoPanelResizeHandle"
        >
          <span className={styles.resizeHandleIcon} aria-hidden />
        </button>
      ) : null}
    </div>
  );
};
