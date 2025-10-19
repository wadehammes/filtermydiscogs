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
import styles from "./page.module.css";

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

export default function MosaicPage() {
  const { authLoading } = useAuthRedirect();
  const { state } = useAuth();
  const { state: collectionState } = useCollectionContext();
  const { releases } = collectionState;
  const { isLoading: collectionLoading } = useCollectionData(
    state.username,
    state.isAuthenticated,
  );
  const [isGenerating, setIsGenerating] = useState(false);
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
    const gap = 2; // Grid gap

    // Calculate optimal cell size (aim for 80px cells)
    const targetCellSize = 80;
    const cols = Math.floor(
      (availableWidth - padding) / (targetCellSize + gap),
    );
    const rows = Math.ceil(itemCount / cols);

    // Adjust cell size to fit available width
    const actualCellSize = Math.floor(
      (availableWidth - padding - (cols - 1) * gap) / cols,
    );

    return {
      cols: Math.max(1, cols),
      rows,
      cellSize: Math.max(30, Math.min(200, actualCellSize)), // Min 30px, max 200px
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
    if (!canvasRef.current || releasesToDisplay.length === 0) return;

    setIsGenerating(true);

    try {
      trackEvent("mosaicDownload", {
        action: "mosaicDownload",
        category: "mosaic",
        label: "Download Mosaic",
        value: releasesToDisplay.length.toString(),
      });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

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

      // Force load all lazy images first
      console.log("Forcing load of all lazy images...");
      const allImages = document.querySelectorAll('img[loading="lazy"]');
      allImages.forEach((img) => {
        (img as HTMLImageElement).loading = "eager";
        // Force reload by temporarily changing src
        const originalSrc = (img as HTMLImageElement).src;
        (img as HTMLImageElement).src = "";
        (img as HTMLImageElement).src = originalSrc;
      });

      // Wait a moment for images to start loading
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Try using a proxy approach - fetch images through our API
      const imagePromises = releasesToDisplay.map((release, index) => {
        return new Promise<void>((resolve) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = col * cellSize;
          const y = row * cellSize;

          const imageUrl =
            release.basic_information.thumb ||
            release.basic_information.cover_image ||
            `https://placehold.jp/effbf2/000/${cellSize}x${cellSize}.png?text=♪`;

          console.log(
            `Loading image ${index + 1}/${releasesToDisplay.length}: ${release.basic_information.title}`,
          );

          // Try to use the existing DOM images first
          const domImage = document.querySelector(
            `img[alt="${release.basic_information.title}"]`,
          ) as HTMLImageElement;

          if (domImage?.complete && domImage.naturalWidth > 0) {
            try {
              ctx.drawImage(domImage, x, y, cellSize, cellSize);
              console.log(
                `Successfully drew DOM image for ${release.basic_information.title}`,
              );
              resolve();
              return;
            } catch (error) {
              console.warn(
                `Failed to draw DOM image for ${release.basic_information.title}:`,
                error,
              );
            }
          } else if (domImage) {
            // Image exists but not loaded yet, wait for it
            console.log(
              `Waiting for DOM image to load: ${release.basic_information.title}`,
            );
            domImage.onload = () => {
              try {
                ctx.drawImage(domImage, x, y, cellSize, cellSize);
                console.log(
                  `Successfully drew DOM image after load for ${release.basic_information.title}`,
                );
                resolve();
              } catch (error) {
                console.warn(
                  `Failed to draw DOM image after load for ${release.basic_information.title}:`,
                  error,
                );
                // Fall through to new image creation
                createNewImage();
              }
            };
            domImage.onerror = () => {
              console.log(
                `DOM image failed to load: ${release.basic_information.title}`,
              );
              createNewImage();
            };
            return;
          }

          // Fallback: create new image without CORS
          const createNewImage = () => {
            const img = new window.Image();
            // Don't set crossOrigin to avoid CORS issues

            const timeout = setTimeout(() => {
              console.log(
                `Timeout loading image for ${release.basic_information.title}, using placeholder`,
              );
              drawPlaceholder();
              resolve();
            }, 3000);

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

            img.onload = () => {
              clearTimeout(timeout);
              try {
                console.log(
                  `Image loaded successfully for ${release.basic_information.title}, drawing to canvas...`,
                );
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
              console.log(`Image URL was: ${imageUrl}`);
              drawPlaceholder();
              resolve();
            };

            img.src = imageUrl;
          };

          createNewImage();
        });
      });

      await Promise.all(imagePromises);

      // Convert to blob and download (no CORS issues with generated content!)
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `discogs-mosaic-${new Date().toISOString().split("T")[0]}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    } catch (error) {
      console.error("Error generating mosaic:", error);
    } finally {
      setIsGenerating(false);
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
          hideFilters={true}
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
      <StickyHeaderBar allReleasesLoaded={true} hideCrate={true} />
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
            {isGenerating ? "Generating..." : "Download Mosaic"}
          </button>
        </div>

        <div className={styles.mosaicContainer}>
          <div
            className={styles.mosaicGrid}
            style={{
              gridTemplateColumns: `repeat(${gridDimensions.cols}, ${gridDimensions.cellSize}px)`,
              gridTemplateRows: `repeat(${gridDimensions.rows}, ${gridDimensions.cellSize}px)`,
              aspectRatio: `${gridDimensions.cols} / ${gridDimensions.rows}`,
              maxWidth: "100%",
            }}
          >
            {releasesToDisplay.map((release) => (
              <MosaicItem key={release.instance_id} release={release} />
            ))}
          </div>
        </div>

        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </>
  );
}
