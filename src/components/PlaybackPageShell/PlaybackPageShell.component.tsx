"use client";

import classNames from "classnames";
import { useAtomValue } from "jotai";
import { type ReactNode, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { playbackDockMobileInScrollAtom } from "src/atoms/playbackDockUi.atoms";
import { BELOW_DESKTOP_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useIsMiniPlayerVisible } from "src/context/releasePlayback.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { usePlaybackDockMobileInScroll } from "src/hooks/usePlaybackDockMobileInScroll.hook";
import { PlaybackPageInScrollDock } from "./PlaybackPageInScrollDock.component";
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
        scrollElement={scrollElement}
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
  scrollElement: HTMLElement | null;
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
  scrollElement,
  usesExternalScrollRoot,
  setMainScrollRef,
}: PlaybackPageShellFrameProps) => {
  const { setOverlayPortalElement } = usePlaybackPageShellMountSetters();
  const isMiniPlayerVisible = useIsMiniPlayerVisible();
  const isBelowDesktopLayout = useMediaQuery(BELOW_DESKTOP_LAYOUT_MEDIA_QUERY);
  const usesInScrollPlaybackDock = fillViewport && isBelowDesktopLayout;

  usePlaybackDockMobileInScroll(usesInScrollPlaybackDock);

  const dockInScrollShell = useAtomValue(playbackDockMobileInScrollAtom);

  const setOverlayPortalRef = useCallback(
    (node: HTMLDivElement | null) => {
      setOverlayPortalElement(node);
    },
    [setOverlayPortalElement],
  );

  const inScrollDockNode = (() => {
    if (!usesInScrollPlaybackDock) {
      return null;
    }

    if (usesExternalScrollRoot) {
      if (!scrollElement) {
        return null;
      }

      return createPortal(
        <PlaybackPageInScrollDock />,
        scrollElement,
        "fmd-playback-in-scroll-dock",
      );
    }

    return <PlaybackPageInScrollDock />;
  })();

  return (
    <div
      className={classNames(styles.shell, className, {
        [styles.shellViewport]: fillViewport,
      })}
      data-playback-page-shell
      {...(usesInScrollPlaybackDock
        ? { "data-playback-dock-in-scroll-shell": true }
        : {})}
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
              {!usesExternalScrollRoot ? inScrollDockNode : null}
            </div>
          )}
        </div>
        {overlays ? (
          <div
            className={styles.workspaceOverlays}
            data-playback-workspace-overlays
          >
            {overlays}
          </div>
        ) : null}
        <div
          ref={setOverlayPortalRef}
          className={styles.overlayPortal}
          data-playback-overlay-portal
        />
      </div>
      {usesExternalScrollRoot ? inScrollDockNode : null}
      <div className={styles.dockSlot}>
        {isMiniPlayerVisible && !dockInScrollShell ? (
          <div data-playback-dock-spacer aria-hidden />
        ) : null}
      </div>
    </div>
  );
};
