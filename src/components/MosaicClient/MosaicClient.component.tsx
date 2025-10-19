"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import AuthLoading from "src/components/AuthLoading/AuthLoading.component";
import Login from "src/components/Login/Login.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { useMemoizedFilteredReleases } from "src/context/filters.context";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import { useAuthRedirect } from "src/hooks/useAuthRedirect.hook";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import type { DiscogsRelease } from "src/types";
import styles from "./MosaicClient.module.css";

interface MosaicItemProps {
  release: DiscogsRelease;
}

function MosaicItem({ release }: MosaicItemProps) {
  const [isClicked, setIsClicked] = useState(false);
  const { resource_url } = release.basic_information;

  // Extract release ID from resource_url
  const releaseId = resource_url.split("/").pop() || "";
  const fallbackUri = `https://www.discogs.com/release/${releaseId}`;

  // Only fetch release data when clicked
  const { data: releaseData, isLoading } = useDiscogsReleaseQuery(
    releaseId,
    isClicked, // Only enable query when clicked
  );

  const handleReleaseClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsClicked(true);

      trackEvent("releaseClicked", {
        action: "releaseClicked",
        category: "mosaic",
        label: "Release Clicked (Mosaic)",
        value: resource_url,
      });

      // If we already have the data, open immediately
      if (releaseData?.uri) {
        window.open(releaseData.uri, "_blank", "noopener,noreferrer");
        return;
      }

      // Otherwise, wait for the query to complete
      // The useEffect below will handle opening the URL once data is loaded
    },
    [releaseData?.uri, resource_url],
  );

  // Open URL once we have the release data
  const handleUrlOpen = useCallback(() => {
    if (releaseData?.uri) {
      window.open(releaseData.uri, "_blank", "noopener,noreferrer");
    } else if (!isLoading) {
      // If query failed, use fallback
      window.open(fallbackUri, "_blank", "noopener,noreferrer");
    }
  }, [releaseData?.uri, isLoading, fallbackUri]);

  // Handle opening URL when data is loaded
  useEffect(() => {
    if (isClicked && releaseData?.uri) {
      handleUrlOpen();
      setIsClicked(false);
    }
  }, [isClicked, releaseData?.uri, handleUrlOpen]);

  const imageUrl =
    release.basic_information.thumb ||
    release.basic_information.cover_image ||
    "https://placehold.jp/effbf2/000/100x100.png?text=%F0%9F%98%B5";

  return (
    <button
      type="button"
      className={styles.mosaicItem}
      onClick={handleReleaseClick}
      aria-label={`View ${release.basic_information.title} on Discogs`}
      data-release-id={release.instance_id}
    >
      <Image
        src={imageUrl}
        alt={release.basic_information.title}
        className={styles.mosaicImage}
        loading="lazy"
        width={100}
        height={100}
        sizes="100px"
      />
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
        </div>
      )}
    </button>
  );
}

export default function MosaicClient() {
  const { authLoading } = useAuthRedirect();
  const { state } = useAuth();
  const { state: collectionState } = useCollectionContext();
  const { releases } = collectionState;
  const { isLoading: collectionLoading } = useCollectionData(
    state.username,
    state.isAuthenticated,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Use filtered releases from the filters context
  const filteredReleases = useMemoizedFilteredReleases();
  const releasesToDisplay = filteredReleases;

  // Calculate optimal square grid dimensions
  const calculateGridDimensions = useCallback((itemCount: number) => {
    if (itemCount === 0) return { cols: 0, rows: 0 };

    // Calculate responsive cell size based on container width
    const containerWidth =
      typeof window !== "undefined" ? window.innerWidth : 1200;
    const availableWidth = Math.min(containerWidth * 0.95, 1400); // Max 95% of screen width or 1400px
    const padding = 16; // Reduced padding
    const _gap = 0; // No gap for seamless mosaic

    // Dynamic cell size based on number of releases
    // Fewer releases = bigger cells, more releases = smaller cells
    let targetCellSize: number;
    if (itemCount <= 50) {
      targetCellSize = Math.min(250, Math.max(120, 300 - itemCount * 2)); // 120-250px for small collections
    } else if (itemCount <= 200) {
      targetCellSize = Math.min(120, Math.max(80, 150 - itemCount * 0.3)); // 80-120px for medium collections
    } else {
      targetCellSize = Math.min(80, Math.max(60, 100 - itemCount * 0.1)); // 60-80px for large collections
    }

    const cols = Math.floor((availableWidth - padding) / targetCellSize);
    const rows = Math.ceil(itemCount / cols);

    // Adjust cell size to fit available width
    const actualCellSize = Math.floor((availableWidth - padding) / cols);

    return {
      cols: Math.max(1, cols),
      rows,
      cellSize: Math.max(60, Math.min(250, actualCellSize)), // Min 60px, max 250px
    };
  }, []);

  const [gridDimensions, setGridDimensions] = useState(() =>
    calculateGridDimensions(releasesToDisplay.length),
  );

  // Update grid dimensions on window resize
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const updateGridDimensions = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setGridDimensions(calculateGridDimensions(releasesToDisplay.length));
      }, 100); // Debounce resize events
    };

    // Initial calculation
    updateGridDimensions();

    // Add resize listener
    window.addEventListener("resize", updateGridDimensions);

    return () => {
      window.removeEventListener("resize", updateGridDimensions);
      clearTimeout(timeoutId);
    };
  }, [releasesToDisplay.length, calculateGridDimensions]);

  const downloadMosaic = useCallback(async () => {
    console.log("Download mosaic button clicked");
    if (!canvasRef.current || releasesToDisplay.length === 0) {
      console.log("Early return: canvas ref or no releases");
      return;
    }

    console.log("Starting mosaic generation...");
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      trackEvent("mosaicDownload", {
        action: "mosaicDownload",
        category: "mosaic",
        label: "Download Mosaic",
        value: releasesToDisplay.length.toString(),
      });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Failed to get canvas context");
        return;
      }

      // Calculate grid dimensions for download
      const { cols, rows } = calculateGridDimensions(releasesToDisplay.length);

      // Set canvas size (adjust as needed for social media)
      const cellSize = 200; // Increased size for better quality
      const canvasWidth = cols * cellSize;
      const canvasHeight = rows * cellSize;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Fill background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      console.log(
        `Generating mosaic for ${releasesToDisplay.length} releases in ${cols}x${rows} grid`,
      );

      // Create a simplified image loading function using our proxy
      const loadImageForCanvas = (
        release: DiscogsRelease,
        index: number,
      ): Promise<void> => {
        return new Promise((resolve) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = col * cellSize;
          const y = row * cellSize;

          const originalImageUrl =
            release.basic_information.thumb ||
            release.basic_information.cover_image;

          const drawPlaceholder = () => {
            ctx.fillStyle = "#f0f0f0";
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.strokeStyle = "#cccccc";
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize, cellSize);
            ctx.fillStyle = "#999999";
            ctx.font = `${cellSize * 0.3}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("♪", x + cellSize / 2, y + cellSize / 2);
          };

          // If no image URL, draw placeholder immediately
          if (!originalImageUrl) {
            drawPlaceholder();
            resolve();
            return;
          }

          const img = new window.Image();

          // Set a reasonable timeout for each image
          const timeout = setTimeout(() => {
            console.log(
              `Timeout loading image for ${release.basic_information.title}, using placeholder`,
            );
            drawPlaceholder();
            resolve();
          }, 3000); // Reduced timeout to 3 seconds

          img.onload = () => {
            clearTimeout(timeout);
            try {
              ctx.drawImage(img, x, y, cellSize, cellSize);
              console.log(
                `Successfully drew image for ${release.basic_information.title}`,
              );
            } catch (error) {
              console.warn(
                `Failed to draw image for ${release.basic_information.title}:`,
                error,
              );
              drawPlaceholder();
            }
            resolve();
          };

          img.onerror = (error) => {
            clearTimeout(timeout);
            console.log(
              `Failed to load image for ${release.basic_information.title}:`,
              error,
            );
            drawPlaceholder();
            resolve();
          };

          // Use our proxy to avoid CORS issues
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(originalImageUrl)}`;
          img.crossOrigin = "anonymous";
          img.src = proxyUrl;
        });
      };

      // Process images in smaller batches for faster processing
      const batchSize = 5; // Reduced batch size for faster processing
      const totalBatches = Math.ceil(releasesToDisplay.length / batchSize);

      console.log(
        `Processing ${releasesToDisplay.length} images in ${totalBatches} batches of ${batchSize}`,
      );

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(
          startIndex + batchSize,
          releasesToDisplay.length,
        );
        const batch = releasesToDisplay.slice(startIndex, endIndex);

        console.log(
          `Processing batch ${batchIndex + 1}/${totalBatches} (${startIndex + 1}-${endIndex})`,
        );

        const batchPromises = batch.map((release, batchItemIndex) =>
          loadImageForCanvas(release, startIndex + batchItemIndex),
        );

        try {
          await Promise.all(batchPromises);
          console.log(`Completed batch ${batchIndex + 1}/${totalBatches}`);

          // Update progress
          const progress = Math.round(((batchIndex + 1) / totalBatches) * 100);
          setGenerationProgress(progress);

          // Small delay between batches to prevent overwhelming the server
          if (batchIndex < totalBatches - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Error in batch ${batchIndex + 1}:`, error);
          // Continue with next batch even if this one fails
        }
      }

      // Convert to blob and download
      console.log("Canvas size:", canvas.width, "x", canvas.height);
      canvas.toBlob((blob) => {
        console.log("Canvas toBlob callback called, blob:", blob);
        if (blob) {
          console.log("Blob size:", blob.size, "bytes");
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `discogs-mosaic-${new Date().toISOString().split("T")[0]}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log("Download triggered successfully");
        } else {
          console.error("Canvas toBlob returned null blob");
        }
      }, "image/png");
    } catch (error) {
      console.error("Error generating mosaic:", error);
    } finally {
      console.log("Mosaic generation completed, setting isGenerating to false");
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [releasesToDisplay, calculateGridDimensions]);

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
          <button
            type="button"
            className={styles.downloadButton}
            onClick={downloadMosaic}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <div className={styles.generatingContent}>
                <div className={styles.generatingText}>
                  Generating... {generationProgress}%
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              "Download Mosaic"
            )}
          </button>
        </div>

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
    </>
  );
}
