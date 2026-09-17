"use client";

import classNames from "classnames";
import styles from "./BottomDrawer.module.css";

interface BottomDrawerOverlayProps {
  isOpen: boolean;
  aboveMiniPlayer: boolean;
  behindMiniPlayer: boolean;
  dataAttribute?: string;
  onClose: () => void;
}

export const BottomDrawerOverlay = ({
  isOpen,
  aboveMiniPlayer,
  behindMiniPlayer,
  dataAttribute,
  onClose,
}: BottomDrawerOverlayProps) => (
  <button
    type="button"
    className={classNames(styles.overlay, {
      [styles.open]: isOpen,
      [styles.aboveMiniPlayer]: aboveMiniPlayer,
      [styles.behindMiniPlayer]: behindMiniPlayer,
    })}
    onClick={onClose}
    aria-label="Close drawer overlay"
    {...(dataAttribute ? { [dataAttribute]: "true" } : {})}
  />
);
