"use client";

import { useEffect, useState } from "react";
import AuthLoading from "src/components/AuthLoading/AuthLoading.component";
import Login from "src/components/Login/Login.component";
import MosaicControls from "src/components/MosaicClient/MosaicControls.component";
import MosaicItem from "src/components/MosaicClient/MosaicItem.component";
import Spinner from "src/components/Spinner/Spinner.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { MOSAIC_CONSTANTS } from "src/constants/mosaic";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import {
  FiltersActionTypes,
  useFilters,
  useMemoizedFilteredReleases,
} from "src/context/filters.context";
import { useView, ViewActionTypes } from "src/context/view.context";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import { useGridDimensions } from "src/hooks/useGridDimensions.hook";
import { useMosaicGenerator } from "src/hooks/useMosaicGenerator.hook";
import styles from "./MosaicClient.module.css";

export default function MosaicClient() {
  const { state } = useAuth();
  const { state: collectionState } = useCollectionContext();
  const { releases } = collectionState;
  const { isLoading: collectionLoading } = useCollectionData(
    state.username,
    state.isAuthenticated,
  );
  const { state: viewState, dispatch: viewDispatch } = useView();
  const { dispatch: filtersDispatch, state: filtersState } = useFilters();

  useEffect(() => {
    if (viewState.currentView === "random") {
      viewDispatch({
        type: ViewActionTypes.SetView,
        payload: "card",
      });
    }
  }, [viewState.currentView, viewDispatch]);

  useEffect(() => {
    if (filtersState.isRandomMode) {
      filtersDispatch({
        type: FiltersActionTypes.ToggleRandomMode,
        payload: undefined,
      });
    }
  }, [filtersState.isRandomMode, filtersDispatch]);

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

  if (!state.isAuthenticated && state.isLoading) {
    return <AuthLoading />;
  }

  if (!state.isAuthenticated) {
    return <Login />;
  }

  if (collectionLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner
          size="2xl"
          className={styles.spinner}
          aria-label="Loading your collection"
        />
        <p>Loading your collection...</p>
      </div>
    );
  }

  if (releasesToDisplay.length === 0) {
    return (
      <>
        <StickyHeaderBar allReleasesLoaded={true} currentPage="mosaic" />
        <div className={styles.emptyState}>
          <h1>No releases to display</h1>
          <p>
            {releases.length === 0
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
            {releasesToDisplay.length === releases.length
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
