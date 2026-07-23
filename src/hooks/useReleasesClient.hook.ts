import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useAuth } from "src/context/auth.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { ViewActionTypes } from "src/context/view.context";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import {
  useAllReleases,
  useFilteredReleases,
  useFiltersDispatch,
  useIsRandomMode,
  useRandomRelease,
  useSearchQuery,
  useSelectedFormats,
  useSelectedSort,
  useSelectedStyles,
  useSelectedYears,
  useStyleOperator,
} from "src/hooks/useFilterAtoms.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { useReleasesDisplay } from "src/hooks/useReleasesDisplay.hook";
import {
  useCurrentView,
  usePreviousView,
  useViewDispatch,
} from "src/hooks/useViewAtoms.hook";
import type { DiscogsRelease } from "src/types";
import { filterReleases } from "src/utils/filterReleases";

const INITIAL_VISIBLE_RELEASES = 100;
const VISIBLE_BATCH_SIZE = 100;

export const useReleasesClient = () => {
  const { state: authState } = useAuth();
  const { username, isAuthenticated, rateLimited } = authState;
  const currentView = useCurrentView();
  const previousView = usePreviousView();
  const viewDispatch = useViewDispatch();
  const filtersDispatch = useFiltersDispatch();
  const filteredReleases = useFilteredReleases();
  const isRandomMode = useIsRandomMode();
  const randomRelease = useRandomRelease();
  const allReleases = useAllReleases();
  const selectedStyles = useSelectedStyles();
  const selectedYears = useSelectedYears();
  const selectedFormats = useSelectedFormats();
  const selectedSort = useSelectedSort();
  const styleOperator = useStyleOperator();
  const searchQuery = useSearchQuery();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const mainContentRef = useRef<HTMLDivElement>(null);

  const [showAllLoadedMessage, setShowAllLoadedMessage] = useState(false);

  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(
    null,
  );
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_RELEASES);

  const { isLoading, hasNextPage, isFetchingNextPage } = useCollectionData(
    username,
    isAuthenticated,
    rateLimited,
  );
  const { error, hasReleases, hasError } = useReleasesDisplay();

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  const releaseCount = filteredReleases.length;

  const visibleReleases =
    !isRandomMode && filteredReleases.length > visibleCount
      ? filteredReleases.slice(0, visibleCount)
      : filteredReleases;

  const hasMoreVisible =
    !isRandomMode && filteredReleases.length > visibleReleases.length;

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset visible batch when filter inputs or random mode change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_RELEASES);
  }, [
    selectedStyles,
    selectedYears,
    selectedFormats,
    searchQuery,
    selectedSort,
    styleOperator,
    isRandomMode,
  ]);

  const handleReleaseClick = useCallback((instanceId: string) => {
    setSelectedReleaseId(instanceId);
  }, []);

  const selectedRelease = useMemo(() => {
    if (!selectedReleaseId) {
      return null;
    }

    return (
      allReleases.find((r) => String(r.instance_id) === selectedReleaseId) ??
      filteredReleases.find(
        (r) => String(r.instance_id) === selectedReleaseId,
      ) ??
      null
    );
  }, [selectedReleaseId, allReleases, filteredReleases]);

  const handleCloseModal = useCallback(() => {
    setSelectedReleaseId(null);
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
    const currentFilteredReleases = filterReleases({
      releases: allReleases,
      selectedStyles,
      selectedYears,
      selectedFormats,
      searchQuery,
    });

    const nextRandomRelease = getRandomRelease(currentFilteredReleases);
    if (nextRandomRelease) {
      filtersDispatch({
        type: FiltersActionTypes.SetRandomRelease,
        payload: nextRandomRelease,
      });
    }
  }, [
    allReleases,
    selectedStyles,
    selectedYears,
    selectedFormats,
    searchQuery,
    filtersDispatch,
    getRandomRelease,
  ]);

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
    isRandomMode,
    randomRelease,

    isMobile,
    currentView,

    mainContentRef,
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
