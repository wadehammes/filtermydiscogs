"use client";

import classNames from "classnames";
import { type ReactNode, useEffect, useRef } from "react";
import { ReleasePlaybackVideoPanelChrome } from "src/components/ReleasePlaybackVideoPanel/ReleasePlaybackVideoPanelChrome.component";
import {
  DESKTOP_VIDEO_RESIZE_CORNERS,
  ReleasePlaybackVideoPanelResizeHandle,
} from "src/components/ReleasePlaybackVideoPanel/ReleasePlaybackVideoPanelResizeHandle.component";
import { useDraggablePanel } from "src/hooks/useDraggablePanel.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
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
        <ReleasePlaybackVideoPanelChrome
          useFloatingLayout={useFloatingLayout}
          {...(onClose ? { onClose } : {})}
          onDragPointerDown={handlePointerDown}
          onResetLayout={resetLayout}
          onResizePointerDown={handleResizePointerDown}
        />
      ) : null}
      <div
        className={classNames(styles.videoContent, {
          [styles.videoContentInteractive]: isExpanded && !isInteracting,
        })}
      >
        {children}
        {isExpanded && useFloatingLayout
          ? DESKTOP_VIDEO_RESIZE_CORNERS.map((corner) => (
              <ReleasePlaybackVideoPanelResizeHandle
                key={corner}
                corner={corner}
                placement="video"
                onResizePointerDown={handleResizePointerDown}
              />
            ))
          : null}
      </div>
    </div>
  );
};
