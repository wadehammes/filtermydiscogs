"use client";

import { useEffect, useState } from "react";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import MosaicControls from "src/components/MosaicClient/MosaicControls.component";
import MosaicItem from "src/components/MosaicClient/MosaicItem.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { MOSAIC_CONSTANTS } from "src/constants/mosaic";
import { useAuth } from "src/context/auth.context";
import {
  FiltersActionTypes,
  useMemoizedFilteredReleases,
} from "src/context/filters.context";
import { ViewActionTypes } from "src/context/view.context";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import {
  useAllReleases,
  useFiltersDispatch,
  useIsRandomMode,
} from "src/hooks/useFilterAtoms.hook";
import { useGridDimensions } from "src/hooks/useGridDimensions.hook";
import { useMosaicGenerator } from "src/hooks/useMosaicGenerator.hook";
import { useNeedsCollectionLoad } from "src/hooks/useNeedsCollectionLoad.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useCurrentView, useViewDispatch } from "src/hooks/useViewAtoms.hook";
import styles from "./MosaicClient.module.css";

export default function MosaicClient() {
  const { state } = useAuth();
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const allReleases = useAllReleases();
  const { isLoading: collectionLoading } = useCollectionData(
    state.username,
    state.isAuthenticated,
  );
  const needsCollectionLoad = useNeedsCollectionLoad(collectionLoading);
  const showLoading = isCheckingAuth || needsCollectionLoad;
  const currentView = useCurrentView();
  const viewDispatch = useViewDispatch();
  const filtersDispatch = useFiltersDispatch();
  const isRandomMode = useIsRandomMode();

  useEffect(() => {
    if (currentView === "random") {
      viewDispatch({
        type: ViewActionTypes.SetView,
        payload: "card",
      });
    }
  }, [currentView, viewDispatch]);

  useEffect(() => {
    if (isRandomMode) {
      filtersDispatch({
        type: FiltersActionTypes.ToggleRandomMode,
        payload: undefined,
      });
    }
  }, [isRandomMode, filtersDispatch]);

  const [imageFormat, setImageFormat] = useState<"jpeg" | "png">(
    MOSAIC_CONSTANTS.DEFAULT_FORMAT,
  );
  const imageQuality = 90;
  const [aspectRatio, setAspectRatio] =
    useState<keyof typeof MOSAIC_CONSTANTS.ASPECT_RATIOS>("SQUARE");

  const releasesToDisplay = useMemoizedFilteredReleases();

  const gridDimensions = useGridDimensions({
    itemCount: releasesToDisplay.length,
  });
  const { isGenerating, generationProgress, canvasRef, downloadMosaic } =
    useMosaicGenerator({
      releases: releasesToDisplay,
      imageFormat,
      imageQuality,
      aspectRatio,
    });

  if (shouldRedirectHome) {
    return null;
  }

  if (showLoading) {
    return <AppPageLoading currentPage="mosaic" />;
  }

  if (releasesToDisplay.length === 0) {
    return (
      <>
        <StickyHeaderBar allReleasesLoaded={true} currentPage="mosaic" />
        <div className={styles.emptyState}>
          <h1>No releases to display</h1>
          <p>
            {allReleases.length === 0
              ? "Your collection appears to be empty"
              : "No releases match your current filters. Try adjusting your filter settings."}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <StickyHeaderBar allReleasesLoaded={true} currentPage="mosaic" />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Album Mosaic</h1>
          <p>
            {releasesToDisplay.length === allReleases.length
              ? `Showing all ${releasesToDisplay.length} releases from your collection`
              : `Showing ${releasesToDisplay.length} filtered releases from your collection`}
          </p>

          <MosaicControls
            imageFormat={imageFormat}
            aspectRatio={aspectRatio}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            onFormatChange={setImageFormat}
            onAspectRatioChange={setAspectRatio}
            onDownload={downloadMosaic}
          />

          <div className={styles.mosaicContainer}>
            {gridDimensions.cols > 0 &&
              gridDimensions.cellSize &&
              gridDimensions.cellSize > 0 && (
                <div
                  className={styles.mosaicGrid}
                  style={{
                    gridTemplateColumns: `repeat(${gridDimensions.cols}, ${gridDimensions.cellSize}px)`,
                    gridTemplateRows: `repeat(${gridDimensions.rows}, ${gridDimensions.cellSize}px)`,
                    maxWidth: "100%",
                  }}
                >
                  {releasesToDisplay.map((release) => (
                    <MosaicItem
                      key={release.instance_id}
                      release={release}
                      totalReleases={releasesToDisplay.length}
                    />
                  ))}
                </div>
              )}
          </div>

          {/* Hidden canvas for image generation */}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      </div>
    </>
  );
}
