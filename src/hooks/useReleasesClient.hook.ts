import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { trackViewModeChanged } from "src/analytics/productAnalyticsEvents";
import { usePlaybackPageScrollElement } from "src/components/PlaybackPageShell/PlaybackPageShell.context";
import { useAuth } from "src/context/auth.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { ViewActionTypes } from "src/context/view.context";
import { useCollectionLoadState } from "src/hooks/useCollectionData.hook";
import {
  useFilteredReleases,
  useFiltersDispatch,
  useIsRandomMode,
  useIsSearching,
  useRandomRelease,
  useSortedFilteredReleases,
} from "src/hooks/useFilterAtoms.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { useReleasesDisplay } from "src/hooks/useReleasesDisplay.hook";
import { useSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import {
  useCurrentView,
  usePreviousView,
  useViewDispatch,
} from "src/hooks/useViewAtoms.hook";
import type { DiscogsRelease } from "src/types";

const INITIAL_VISIBLE_RELEASES = 100;
const VISIBLE_BATCH_SIZE = 100;

export const useReleasesClient = () => {
  const { state: authState } = useAuth();
  const currentView = useCurrentView();
  const previousView = usePreviousView();
  const viewDispatch = useViewDispatch();
  const filtersDispatch = useFiltersDispatch();
  const filteredReleases = useFilteredReleases();
  const isRandomMode = useIsRandomMode();
  const isSearching = useIsSearching();
  const deferredFilteredReleases = useDeferredValue(filteredReleases);
  const isFilterPending =
    !isRandomMode &&
    isSearching &&
    filteredReleases !== deferredFilteredReleases;
  const randomRelease = useRandomRelease();
  const sortedFilteredReleases = useSortedFilteredReleases();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [showAllLoadedMessage, setShowAllLoadedMessage] = useState(false);

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_RELEASES);

  const { isLoading, hasNextPage, isFetchingNextPage } =
    useCollectionLoadState();
  const { error, hasReleases, hasError } = useReleasesDisplay();
  const scrollElement = usePlaybackPageScrollElement();

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
    root: scrollElement,
  });

  const releaseCount = filteredReleases.length;

  const gridSourceReleases =
    isRandomMode || !isSearching ? filteredReleases : deferredFilteredReleases;

  const visibleReleases =
    !isRandomMode && gridSourceReleases.length > visibleCount
      ? gridSourceReleases.slice(0, visibleCount)
      : gridSourceReleases;

  const hasMoreVisible =
    !isRandomMode && gridSourceReleases.length > visibleReleases.length;

  useEffect(() => {
    if (isMobile && currentView === "list") {
      viewDispatch({
        type: ViewActionTypes.SetView,
        payload: "card",
      });
    }
  }, [isMobile, currentView, viewDispatch]);

  useEffect(() => {
    if (!isRandomMode && currentView === "random") {
      const nextView =
        previousView === "list" ? "card" : previousView || "card";
      viewDispatch({
        type: ViewActionTypes.SetView,
        payload: nextView,
      });
    }
  }, [isRandomMode, currentView, previousView, viewDispatch]);

  useEffect(() => {
    const allLoaded = !(hasNextPage || isFetchingNextPage) && hasReleases;
    let timeout: NodeJS.Timeout | undefined;

    if (allLoaded) {
      setShowAllLoadedMessage(true);
      timeout = setTimeout(() => {
        setShowAllLoadedMessage(false);
      }, 3000);
    } else {
      setShowAllLoadedMessage(false);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [hasNextPage, isFetchingNextPage, hasReleases]);

  useEffect(() => {
    if (inView && hasMoreVisible) {
      setVisibleCount((prev) => prev + VISIBLE_BATCH_SIZE);
    }
  }, [inView, hasMoreVisible]);

  useEffect(() => {
    if (isRandomMode) {
      setVisibleCount(INITIAL_VISIBLE_RELEASES);
      return;
    }

    if (sortedFilteredReleases.length >= 0) {
      setVisibleCount(INITIAL_VISIBLE_RELEASES);
    }
  }, [isRandomMode, sortedFilteredReleases]);

  const {
    selectedRelease,
    selectedReleaseId,
    handleReleaseClick,
    handleCloseModal,
  } = useSelectedReleaseModal({
    collectionUsername: authState.username,
  });

  const handleViewChange = useCallback(
    (view: "card" | "list" | "random") => {
      trackViewModeChanged(view);
      viewDispatch({
        type: ViewActionTypes.SetView,
        payload: view,
      });

      if (view === "random") {
        filtersDispatch({
          type: FiltersActionTypes.ToggleRandomMode,
          payload: undefined,
        });
      } else if (isRandomMode) {
        filtersDispatch({
          type: FiltersActionTypes.ToggleRandomMode,
          payload: undefined,
        });
      }
    },
    [viewDispatch, filtersDispatch, isRandomMode],
  );

  const getRandomRelease = useCallback((releases: DiscogsRelease[]) => {
    if (releases.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * releases.length);
    return releases[randomIndex] || null;
  }, []);

  const handleRandomClick = useCallback(() => {
    const nextRandomRelease = getRandomRelease(sortedFilteredReleases);
    if (nextRandomRelease) {
      filtersDispatch({
        type: FiltersActionTypes.SetRandomRelease,
        payload: nextRandomRelease,
      });
    }
  }, [sortedFilteredReleases, filtersDispatch, getRandomRelease]);

  const handleExitRandomMode = useCallback(() => {
    filtersDispatch({
      type: FiltersActionTypes.ToggleRandomMode,
      payload: undefined,
    });
  }, [filtersDispatch]);

  return {
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    hasError,
    error,
    hasReleases,
    showAllLoadedMessage,

    filteredReleases,
    visibleReleases,
    releaseCount,
    isFilterPending,
    isRandomMode,
    randomRelease,

    isMobile,
    currentView,

    infiniteScrollRef: ref,

    selectedReleaseId,
    selectedRelease,

    handleReleaseClick,
    handleCloseModal,
    handleViewChange,
    handleRandomClick,
    handleExitRandomMode,
  };
};
