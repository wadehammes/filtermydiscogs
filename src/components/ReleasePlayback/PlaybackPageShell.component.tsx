"use client";

import classNames from "classnames";
import { type ReactNode, useCallback, useState } from "react";
import { PlaybackPageShellProvider } from "./PlaybackPageShell.context";
import styles from "./PlaybackPageShell.module.css";
import { PlaybackScrollSpacer } from "./PlaybackScrollSpacer.component";

interface PlaybackPageShellProps {
  children: ReactNode;
  className?: string;
  fillViewport?: boolean;
  header?: ReactNode;
  mainClassName?: string;
  overlays?: ReactNode;
  scrollElement?: HTMLElement | null;
}

export const PlaybackPageShell = ({
  children,
  className,
  fillViewport = false,
  header,
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
      <div
        className={classNames(styles.shell, className, {
          [styles.shellViewport]: fillViewport,
        })}
        data-playback-page-shell
        data-testid="fmdPlaybackPageShell"
      >
        {header ? <div className={styles.headerSlot}>{header}</div> : null}
        <div
          className={classNames(styles.main, mainClassName, {
            [styles.mainPassthrough]: usesExternalScrollRoot,
          })}
        >
          {usesExternalScrollRoot ? (
            children
          ) : (
            <div
              ref={setMainScrollRef}
              className={styles.mainScroll}
              data-playback-page-shell-main
            >
              {children}
              <PlaybackScrollSpacer />
            </div>
          )}
        </div>
        {usesExternalScrollRoot ? (
          <div data-playback-dock-spacer aria-hidden />
        ) : null}
        {overlays}
      </div>
    </PlaybackPageShellProvider>
  );
};
