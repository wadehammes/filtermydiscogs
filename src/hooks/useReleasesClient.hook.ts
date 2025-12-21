import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useAuth } from "src/context/auth.context";
import { FiltersActionTypes, useFilters } from "src/context/filters.context";
import { useView, ViewActionTypes } from "src/context/view.context";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { useReleasesDisplay } from "src/hooks/useReleasesDisplay.hook";
import type { DiscogsRelease } from "src/types";
import { filterReleases } from "src/utils/filterReleases";

export const useReleasesClient = () => {
  const { state: authState } = useAuth();
  const authLoading = !authState.isAuthenticated && authState.isLoading;
  const { username, isAuthenticated } = authState;
  const { state: viewState, dispatch: viewDispatch } = useView();
  const { state: filtersState, dispatch: filtersDispatch } = useFilters();
  const { selectedSort, filteredReleases, isRandomMode, randomRelease } =
    filtersState;
  const isMobile = useMediaQuery("(max-width: 768px)");
  const mainContentRef = useRef<HTMLDivElement>(null);

  const [showAllLoadedMessage, setShowAllLoadedMessage] = useState(false);
  const [highlightedReleaseId, setHighlightedReleaseId] = useState<
    string | null
  >(null);
  const [isSorting, setIsSorting] = useState(false);
  const [previousSort, setPreviousSort] = useState(selectedSort);

  const { isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useCollectionData(username, isAuthenticated);
  const { error, hasReleases, hasError } = useReleasesDisplay();

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  const releaseCount = filteredReleases.length;

  useEffect(() => {
    if (selectedSort !== previousSort) {
      setIsSorting(true);
      setPreviousSort(selectedSort);
    }
  }, [selectedSort, previousSort]);

  useEffect(() => {
    if (isSorting && releaseCount > 0) {
      setIsSorting(false);
    }
  }, [isSorting, releaseCount]);

  useEffect(() => {
    if (!isRandomMode && viewState.currentView === "random") {
      const previousView =
        viewState.previousView === "list"
          ? "card"
          : viewState.previousView || "card";
      viewDispatch({
        type: ViewActionTypes.SetView,
        payload: previousView,
      });
    }
  }, [
    isRandomMode,
    viewState.currentView,
    viewState.previousView,
    viewDispatch,
  ]);

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
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleReleaseClick = useCallback((instanceId: string) => {
    const element = document.getElementById(`release-${instanceId}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      setTimeout(() => {
        setHighlightedReleaseId(instanceId);
        setTimeout(() => {
          setHighlightedReleaseId(null);
        }, 3000);
      }, 500);
    }
  }, []);

  const handleViewChange = useCallback(
    (view: "card" | "list" | "random") => {
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
    const {
      allReleases,
      selectedStyles,
      selectedYears,
      selectedFormats,
      searchQuery,
    } = filtersState;

    const currentFilteredReleases = filterReleases(
      allReleases,
      selectedStyles,
      selectedYears,
      selectedFormats,
      searchQuery,
    );

    const randomRelease = getRandomRelease(currentFilteredReleases);
    if (randomRelease) {
      filtersDispatch({
        type: FiltersActionTypes.SetRandomRelease,
        payload: randomRelease,
      });
    }
  }, [filtersState, filtersDispatch, getRandomRelease]);

  const handleExitRandomMode = useCallback(() => {
    filtersDispatch({
      type: FiltersActionTypes.ToggleRandomMode,
      payload: undefined,
    });
  }, [filtersDispatch]);

  return {
    authLoading,
    isLoading,
    hasError,
    error,
    hasReleases,
    isFetchingNextPage,
    showAllLoadedMessage,

    filteredReleases,
    releaseCount,
    isRandomMode,
    randomRelease,

    isMobile,
    viewState,
    highlightedReleaseId,
    isSorting,

    mainContentRef,
    infiniteScrollRef: ref,

    handleReleaseClick,
    handleViewChange,
    handleRandomClick,
    handleExitRandomMode,
  };
};
