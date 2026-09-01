"use client";

import classNames from "classnames";
import { type ReactNode, useCallback, useState } from "react";
import { useIsMiniPlayerVisible } from "src/context/releasePlayback.context";
import {
  PlaybackPageShellProvider,
  usePlaybackPageShellMountSetters,
} from "./PlaybackPageShell.context";
import styles from "./PlaybackPageShell.module.css";

interface PlaybackPageShellProps {
  children: ReactNode;
  className?: string;
  fillViewport?: boolean;
  header?: ReactNode;
  subheader?: ReactNode;
  mainClassName?: string;
  overlays?: ReactNode;
  scrollElement?: HTMLElement | null;
}

export const PlaybackPageShell = ({
  children,
  className,
  fillViewport = false,
  header,
  subheader,
  mainClassName,
  overlays,
  scrollElement: scrollElementOverride,
}: PlaybackPageShellProps) => {
  const usesExternalScrollRoot = scrollElementOverride !== undefined;
  const [internalScrollElement, setInternalScrollElement] =
    useState<HTMLElement | null>(null);
  const scrollElement = usesExternalScrollRoot
    ? scrollElementOverride
    : internalScrollElement;

  const setMainScrollRef = useCallback((node: HTMLDivElement | null) => {
    setInternalScrollElement(node);
  }, []);

  return (
    <PlaybackPageShellProvider scrollElement={scrollElement}>
      <PlaybackPageShellFrame
        className={className}
        fillViewport={fillViewport}
        header={header}
        subheader={subheader}
        mainClassName={mainClassName}
        overlays={overlays}
        usesExternalScrollRoot={usesExternalScrollRoot}
        setMainScrollRef={setMainScrollRef}
      >
        {children}
      </PlaybackPageShellFrame>
    </PlaybackPageShellProvider>
  );
};

interface PlaybackPageShellFrameProps {
  children: ReactNode;
  className?: string | undefined;
  fillViewport: boolean;
  header?: ReactNode | undefined;
  subheader?: ReactNode | undefined;
  mainClassName?: string | undefined;
  overlays?: ReactNode | undefined;
  usesExternalScrollRoot: boolean;
  setMainScrollRef: (node: HTMLDivElement | null) => void;
}

const PlaybackPageShellFrame = ({
  children,
  className,
  fillViewport,
  header,
  subheader,
  mainClassName,
  overlays,
  usesExternalScrollRoot,
  setMainScrollRef,
}: PlaybackPageShellFrameProps) => {
  const { setOverlayPortalElement } = usePlaybackPageShellMountSetters();
  const isMiniPlayerVisible = useIsMiniPlayerVisible();

  const setOverlayPortalRef = useCallback(
    (node: HTMLDivElement | null) => {
      setOverlayPortalElement(node);
    },
    [setOverlayPortalElement],
  );

  return (
    <div
      className={classNames(styles.shell, className, {
        [styles.shellViewport]: fillViewport,
      })}
      data-playback-page-shell
      data-testid="fmdPlaybackPageShell"
    >
      {header ? <div className={styles.headerSlot}>{header}</div> : null}
      <div className={styles.workspace} data-playback-page-workspace>
        {subheader ? (
          <div className={styles.subheaderSlot}>{subheader}</div>
        ) : null}
        <div className={classNames(styles.main, mainClassName)}>
          {usesExternalScrollRoot ? (
            children
          ) : (
            <div
              ref={setMainScrollRef}
              className={styles.mainScroll}
              data-playback-page-shell-main
            >
              {children}
            </div>
          )}
        </div>
        {overlays ? (
          <div className={styles.workspaceOverlays}>{overlays}</div>
        ) : null}
        <div
          ref={setOverlayPortalRef}
          className={styles.overlayPortal}
          data-playback-overlay-portal
        />
      </div>
      <div className={styles.dockSlot}>
        {isMiniPlayerVisible ? (
          <div data-playback-dock-spacer aria-hidden />
        ) : null}
      </div>
    </div>
  );
};
