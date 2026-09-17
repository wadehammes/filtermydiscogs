import {
  useCallback,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
} from "react";
import { trackViewModeChanged } from "src/analytics/productAnalyticsEvents";
import { usePlaybackPageScrollElement } from "src/components/PlaybackPageShell/PlaybackPageShell.context";
import { useAuth } from "src/context/auth.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { ViewActionTypes } from "src/context/view.context";
import { useCollectionLoadState } from "src/hooks/useCollectionData.hook";
import {
  useFilteredReleases,
  useFiltersDispatch,
  useFormatOperator,
  useIsRandomMode,
  useIsSearching,
  useRandomRelease,
  useSearchQuery,
  useSelectedFormats,
  useSelectedSort,
  useSelectedStyles,
  useSelectedYears,
  useSortedFilteredReleases,
  useStyleOperator,
  useYearOperator,
} from "src/hooks/useFilterAtoms.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { useReleasesDisplay } from "src/hooks/useReleasesDisplay.hook";
import {
  sliceVisibleReleases,
  useReleasesVisibleWindow,
} from "src/hooks/useReleasesVisibleWindow.hook";
import { useSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import {
  useCurrentView,
  usePreviousView,
  useViewDispatch,
} from "src/hooks/useViewAtoms.hook";
import type { DiscogsRelease } from "src/types";

interface UseReleasesClientOptions {
  scrollElement?: HTMLElement | null;
}

export const useReleasesClient = ({
  scrollElement: scrollElementOverride,
}: UseReleasesClientOptions = {}) => {
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
  const searchQuery = useSearchQuery();
  const selectedSort = useSelectedSort();
  const selectedStyles = useSelectedStyles();
  const selectedYears = useSelectedYears();
  const selectedFormats = useSelectedFormats();
  const styleOperator = useStyleOperator();
  const formatOperator = useFormatOperator();
  const yearOperator = useYearOperator();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const { isLoading, hasNextPage, isFetchingNextPage } =
    useCollectionLoadState();
  const { error, hasReleases, hasError } = useReleasesDisplay();
  const contextScrollElement = usePlaybackPageScrollElement();
  const scrollElement = scrollElementOverride ?? contextScrollElement;

  const releaseCount = filteredReleases.length;

  const gridSourceReleases =
    isRandomMode || !isSearching ? filteredReleases : deferredFilteredReleases;

  const visibleCountResetKey = useMemo(
    () =>
      [
        formatOperator,
        isRandomMode,
        searchQuery,
        selectedFormats.join("\0"),
        selectedSort,
        selectedStyles.join("\0"),
        selectedYears.join("\0"),
        styleOperator,
        yearOperator,
      ].join("\u001f"),
    [
      formatOperator,
      isRandomMode,
      searchQuery,
      selectedFormats,
      selectedSort,
      selectedStyles,
      selectedYears,
      styleOperator,
      yearOperator,
    ],
  );

  const { infiniteScrollRef, showAllLoadedMessage, visibleReleasesEndIndex } =
    useReleasesVisibleWindow({
      scrollElement,
      gridSourceLength: gridSourceReleases.length,
      isRandomMode,
      visibleCountResetKey,
      hasNextPage,
      isFetchingNextPage,
      hasReleases,
    });

  const visibleReleases = sliceVisibleReleases(
    filteredReleases,
    visibleReleasesEndIndex,
    isRandomMode,
    isSearching,
    deferredFilteredReleases,
  );

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

  const {
    selectedRelease,
    selectedReleaseId,
    handleReleaseClick,
    handleCloseModal,
  } = useSelectedReleaseModal({
    collectionUsername: authState.username,
    fallbackReleases: sortedFilteredReleases,
  });

  const toggleRandomModeForView = useEffectEvent(
    (view: "card" | "list" | "random") => {
      if (view === "random") {
        filtersDispatch({
          type: FiltersActionTypes.ToggleRandomMode,
          payload: undefined,
        });
        return;
      }

      if (isRandomMode) {
        filtersDispatch({
          type: FiltersActionTypes.ToggleRandomMode,
          payload: undefined,
        });
      }
    },
  );

  const handleViewChange = useCallback(
    (view: "card" | "list" | "random") => {
      trackViewModeChanged(view);
      viewDispatch({
        type: ViewActionTypes.SetView,
        payload: view,
      });
      toggleRandomModeForView(view);
    },
    [viewDispatch],
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

    infiniteScrollRef,

    selectedReleaseId,
    selectedRelease,

    handleReleaseClick,
    handleCloseModal,
    handleViewChange,
    handleRandomClick,
    handleExitRandomMode,
  };
};
