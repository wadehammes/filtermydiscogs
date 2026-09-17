"use client";

import classNames from "classnames";
import type { PointerEvent } from "react";
import type { VideoPanelResizeCorner } from "src/utils/videoPanelCornerResize";
import styles from "./ReleasePlaybackVideoPanel.module.css";

export const DESKTOP_VIDEO_RESIZE_CORNERS: VideoPanelResizeCorner[] = [
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

interface ReleasePlaybackVideoPanelResizeHandleProps {
  corner: VideoPanelResizeCorner;
  placement: "chrome" | "video";
  onResizePointerDown: (
    corner: VideoPanelResizeCorner,
  ) => (event: PointerEvent<HTMLButtonElement>) => void;
}

export const ReleasePlaybackVideoPanelResizeHandle = ({
  corner,
  placement,
  onResizePointerDown,
}: ReleasePlaybackVideoPanelResizeHandleProps) => (
  <button
    type="button"
    className={classNames(
      placement === "chrome" ? styles.panelChromeNwResize : styles.resizeHandle,
      VIDEO_CORNER_RESIZE_CLASS[corner],
    )}
    onPointerDown={onResizePointerDown(corner)}
    aria-label={RESIZE_CORNER_ARIA_LABEL[corner]}
    data-testid="fmdReleasePlaybackVideoPanelResizeHandle"
    data-resize-corner={corner}
  />
);
