"use client";

import { useState } from "react";
import AuthLoading from "src/components/AuthLoading/AuthLoading.component";
import Login from "src/components/Login/Login.component";
import MosaicControls from "src/components/MosaicClient/MosaicControls.component";
import MosaicItem from "src/components/MosaicClient/MosaicItem.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { MOSAIC_CONSTANTS } from "src/constants/mosaic";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { useMemoizedFilteredReleases } from "src/context/filters.context";
import { useAuthRedirect } from "src/hooks/useAuthRedirect.hook";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import { useGridDimensions } from "src/hooks/useGridDimensions.hook";
import { useMosaicGenerator } from "src/hooks/useMosaicGenerator.hook";
import styles from "./MosaicClient.module.css";

export default function MosaicClient() {
  const { authLoading } = useAuthRedirect();
  const { state } = useAuth();
  const { state: collectionState } = useCollectionContext();
  const { releases } = collectionState;
  const { isLoading: collectionLoading } = useCollectionData(
    state.username,
    state.isAuthenticated,
  );

  const [imageFormat, setImageFormat] = useState<"jpeg" | "png">(
    MOSAIC_CONSTANTS.DEFAULT_FORMAT,
  );
  const [imageQuality, setImageQuality] = useState<number>(
    MOSAIC_CONSTANTS.DEFAULT_QUALITY,
  );

  // Use filtered releases from the filters context
  const releasesToDisplay = useMemoizedFilteredReleases();

  // Use custom hooks for grid dimensions and mosaic generation
  const gridDimensions = useGridDimensions({
    itemCount: releasesToDisplay.length,
  });
  const { isGenerating, generationProgress, canvasRef, downloadMosaic } =
    useMosaicGenerator({
      releases: releasesToDisplay,
      gridDimensions,
      imageFormat,
      imageQuality,
    });

  if (authLoading || state.isLoading) {
    return <AuthLoading />;
  }

  if (!state.isAuthenticated) {
    return <Login />;
  }

  if (collectionLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.mainLoadingSpinner}></div>
        <p>Loading your collection...</p>
      </div>
    );
  }

  if (releasesToDisplay.length === 0) {
    return (
      <>
        <StickyHeaderBar
          allReleasesLoaded={true}
          hideCrate={true}
          currentPage="mosaic"
        />
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
      <StickyHeaderBar
        allReleasesLoaded={true}
        hideCrate={true}
        currentPage="mosaic"
      />
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
            imageQuality={imageQuality}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            onFormatChange={setImageFormat}
            onQualityChange={(quality) => setImageQuality(quality)}
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
                    <MosaicItem key={release.instance_id} release={release} />
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
