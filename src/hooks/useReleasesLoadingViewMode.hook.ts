"use client";

import { useSyncExternalStore } from "react";
import { COMPACT_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { useCurrentView } from "src/hooks/useViewAtoms.hook";
import { defaultViewState, type ViewMode } from "src/types/view.types";
import { readInitialCollectionViewMode } from "src/utils/collectionViewModeStorage";

const subscribeNoop = () => () => {};

const coerceCollectionViewForLayout = (
  view: ViewMode,
  isCompact: boolean,
): ViewMode => {
  if (isCompact && view === "list") {
    return "card";
  }

  return view;
};

export type UseReleasesLoadingViewModeOptions = {
  ssrView?: ViewMode;
};

export const useReleasesLoadingViewMode = (
  options: UseReleasesLoadingViewModeOptions = {},
): ViewMode => {
  const { ssrView } = options;
  const isCompact = useMediaQuery(COMPACT_LAYOUT_MEDIA_QUERY);
  const jotaiView = useCurrentView();
  const domView = useSyncExternalStore(
    subscribeNoop,
    readInitialCollectionViewMode,
    () => ssrView ?? defaultViewState.currentView,
  );

  const rawView =
    jotaiView === defaultViewState.currentView &&
    domView !== defaultViewState.currentView
      ? domView
      : jotaiView;

  return coerceCollectionViewForLayout(rawView, isCompact);
};
