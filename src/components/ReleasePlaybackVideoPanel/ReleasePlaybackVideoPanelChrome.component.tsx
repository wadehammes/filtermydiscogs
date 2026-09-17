"use client";

import classNames from "classnames";
import type { PointerEvent } from "react";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { ReleasePlaybackVideoPanelResizeHandle } from "src/components/ReleasePlaybackVideoPanel/ReleasePlaybackVideoPanelResizeHandle.component";
import { RestorePanelLayoutThinIcon } from "src/styles/icons/RestorePanelLayoutThinIcon.component";
import XIcon from "src/styles/icons/x-thin.svg";
import type { VideoPanelResizeCorner } from "src/utils/videoPanelCornerResize";
import styles from "./ReleasePlaybackVideoPanel.module.css";

interface ReleasePlaybackVideoPanelChromeProps {
  useFloatingLayout: boolean;
  onClose?: () => void;
  onDragPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onResetLayout: () => void;
  onResizePointerDown: (
    corner: VideoPanelResizeCorner,
  ) => (event: PointerEvent<HTMLButtonElement>) => void;
}

export const ReleasePlaybackVideoPanelChrome = ({
  useFloatingLayout,
  onClose,
  onDragPointerDown,
  onResetLayout,
  onResizePointerDown,
}: ReleasePlaybackVideoPanelChromeProps) => (
  <div
    className={classNames(styles.panelChrome, {
      [styles.panelChromeMobile]: !useFloatingLayout,
      [styles.panelChromeDraggable]: useFloatingLayout,
    })}
    {...(useFloatingLayout
      ? {
          onPointerDown: onDragPointerDown,
          onDoubleClick: onResetLayout,
          "aria-label":
            "Drag video panel. Double-click or use Reset to restore default position and size.",
          "data-testid": "fmdReleasePlaybackVideoPanelHandle",
        }
      : {})}
  >
    {useFloatingLayout ? (
      <ReleasePlaybackVideoPanelResizeHandle
        corner="nw"
        placement="chrome"
        onResizePointerDown={onResizePointerDown}
      />
    ) : null}
    {useFloatingLayout ? (
      <span className={styles.dragHandleGrip} aria-hidden />
    ) : null}
    {useFloatingLayout || onClose ? (
      <div className={styles.panelChromeActions}>
        {useFloatingLayout ? (
          <IconButton
            className={styles.panelChromeButton}
            onClick={onResetLayout}
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
);
