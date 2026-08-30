"use client";

import type { ReactNode } from "react";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { definedProps } from "src/utils/definedProps";
import { PlaybackPageShell } from "./PlaybackPageShell.component";

interface CollectionPlaybackPageShellProps {
  children: ReactNode;
  className?: string;
  currentPage?: string;
  allReleasesLoaded?: boolean;
  hideFilters?: boolean;
  mainClassName?: string;
  overlays?: ReactNode;
  scrollElement?: HTMLElement | null;
}

export const CollectionPlaybackPageShell = ({
  children,
  className,
  currentPage,
  allReleasesLoaded = true,
  hideFilters = false,
  mainClassName,
  overlays,
  scrollElement,
}: CollectionPlaybackPageShellProps) => {
  const headerBarProps = definedProps({
    allReleasesLoaded,
    currentPage,
    hideFilters,
  });

  return (
    <PlaybackPageShell
      fillViewport
      {...definedProps({
        className,
        mainClassName,
        overlays,
        scrollElement,
      })}
      header={<StickyHeaderBar {...headerBarProps} part="nav" />}
      {...(hideFilters
        ? {}
        : {
            subheader: <StickyHeaderBar {...headerBarProps} part="filters" />,
          })}
    >
      {children}
    </PlaybackPageShell>
  );
};
