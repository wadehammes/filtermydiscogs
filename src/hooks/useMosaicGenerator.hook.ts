import { useCallback, useRef, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import { calculateOptimalGrid, MOSAIC_CONSTANTS } from "src/constants/mosaic";
import type { DiscogsRelease } from "src/types";
import {
  createOptimizedImageLoader,
  getCacheMemoryUsage,
  getCircuitBreakerStatus,
} from "src/utils/imageLoader";

// URL validation function
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hasValidProtocol = ["http:", "https:"].includes(parsedUrl.protocol);
    const hasImageExtension = !!parsedUrl.pathname
      .toLowerCase()
      .match(/\.(jpg|jpeg|png|gif|webp)$/);
    const isTrustedHost =
      parsedUrl.hostname.includes("discogs") ||
      parsedUrl.hostname.includes("amazon");

    return hasValidProtocol && (hasImageExtension || isTrustedHost);
  } catch {
    return false;
  }
}

interface UseMosaicGeneratorOptions {
  releases: DiscogsRelease[];
  imageFormat: "jpeg" | "png";
  imageQuality: number;
  aspectRatio?: keyof typeof MOSAIC_CONSTANTS.ASPECT_RATIOS;
}

interface MosaicGenerationState {
  isGenerating: boolean;
  generationProgress: number;
  error: string | null;
  isCancelled: boolean;
  failedImages: number;
  successfulImages: number;
}

interface MosaicGenerationStats {
  totalImages: number;
  successfulImages: number;
  failedImages: number;
  cacheHits: number;
  retryCount: number;
  circuitBreakerStatus: ReturnType<typeof getCircuitBreakerStatus>;
  memoryUsage: number;
}

export function useMosaicGenerator({
  releases,
  imageFormat,
  imageQuality,
  aspectRatio = "SQUARE",
}: UseMosaicGeneratorOptions) {
  const [state, setState] = useState<MosaicGenerationState>({
    isGenerating: false,
    generationProgress: 0,
    error: null,
    isCancelled: false,
    failedImages: 0,
    successfulImages: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const statsRef = useRef<MosaicGenerationStats>({
    totalImages: 0,
    successfulImages: 0,
    failedImages: 0,
    cacheHits: 0,
    retryCount: 0,
    circuitBreakerStatus: getCircuitBreakerStatus(),
    memoryUsage: 0,
  });

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState((prev) => ({ ...prev, isCancelled: true, isGenerating: false }));
    }
  }, []);

  const downloadMosaic = useCallback(async () => {
    console.log("Download mosaic button clicked");
    if (!canvasRef.current || releases.length === 0) {
      console.log("Early return: canvas ref or no releases");
      return;
    }

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    console.log("Starting mosaic generation...");
    setState({
      isGenerating: true,
      generationProgress: 0,
      error: null,
      isCancelled: false,
      failedImages: 0,
      successfulImages: 0,
    });

    // Reset stats
    statsRef.current = {
      totalImages: releases.length,
      successfulImages: 0,
      failedImages: 0,
      cacheHits: 0,
      retryCount: 0,
      circuitBreakerStatus: getCircuitBreakerStatus(),
      memoryUsage: getCacheMemoryUsage(),
    };

    // Performance monitoring and warnings
    const startTime = performance.now();
    const isLargeCollection =
      releases.length > MOSAIC_CONSTANTS.LARGE_COLLECTION_THRESHOLD;
    const isVeryLargeCollection =
      releases.length > MOSAIC_CONSTANTS.MAX_RECOMMENDED_COLLECTION_SIZE;

    if (isVeryLargeCollection) {
      console.warn(
        `Very large collection detected (${releases.length} items). Performance may be degraded.`,
      );
      setState((prev) => ({
        ...prev,
        error: `Warning: Very large collection (${releases.length} items) may cause performance issues. Consider using filters to reduce the number of items.`,
      }));
    } else if (isLargeCollection) {
      console.log(
        `Large collection detected (${releases.length} items). Using optimized settings.`,
      );
    }

    try {
      trackEvent("mosaicDownload", {
        action: "mosaicDownload",
        category: "mosaic",
        label: "Download Mosaic",
        value: releases.length.toString(),
      });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Failed to get canvas context");
        return;
      }

      // Calculate optimal grid dimensions based on aspect ratio
      const aspectRatioConfig = MOSAIC_CONSTANTS.ASPECT_RATIOS[aspectRatio];
      const optimalGrid = calculateOptimalGrid(
        releases.length,
        aspectRatioConfig,
      );

      const { cols, rows, cellSize, canvasWidth, canvasHeight } = optimalGrid;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      console.log(
        `Grid calculation: ${cols}x${rows} grid, cell size: ${cellSize}px, canvas: ${canvasWidth}x${canvasHeight}px`,
      );
      console.log(
        `Grid coverage: ${cols * cellSize}x${rows * cellSize}px (should fill ${canvasWidth}x${canvasHeight}px)`,
      );

      // Fill background
      ctx.fillStyle = MOSAIC_CONSTANTS.CANVAS_BACKGROUND_COLOR;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      console.log(
        `Generating mosaic for ${releases.length} releases in ${cols}x${rows} grid`,
      );

      // Create optimized image loader
      const imageLoader = createOptimizedImageLoader();

      // Create a simplified image loading function using our proxy
      const loadImageForCanvas = async (
        release: DiscogsRelease,
        index: number,
      ): Promise<void> => {
        // Check for cancellation
        if (signal.aborted) {
          throw new Error("Generation cancelled");
        }

        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = col * cellSize;
        const y = row * cellSize;

        const originalImageUrl =
          release.basic_information.thumb ||
          release.basic_information.cover_image;

        const drawPlaceholder = () => {
          ctx.fillStyle = MOSAIC_CONSTANTS.PLACEHOLDER_COLOR;
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.strokeStyle = MOSAIC_CONSTANTS.PLACEHOLDER_BORDER_COLOR;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellSize, cellSize);
          ctx.fillStyle = MOSAIC_CONSTANTS.PLACEHOLDER_TEXT_COLOR;
          ctx.font = `${cellSize * MOSAIC_CONSTANTS.PLACEHOLDER_FONT_RATIO}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            MOSAIC_CONSTANTS.PLACEHOLDER_SYMBOL,
            x + cellSize / 2,
            y + cellSize / 2,
          );
        };

        // Validate and sanitize image URL
        if (originalImageUrl && !isValidImageUrl(originalImageUrl)) {
          console.warn(
            `Invalid image URL for ${release.basic_information.title}: ${originalImageUrl}`,
          );
          drawPlaceholder();
          statsRef.current.failedImages++;
          setState((prev) => ({
            ...prev,
            failedImages: prev.failedImages + 1,
          }));
          return;
        }

        // If no image URL, draw placeholder immediately
        if (!originalImageUrl) {
          drawPlaceholder();
          statsRef.current.failedImages++;
          setState((prev) => ({
            ...prev,
            failedImages: prev.failedImages + 1,
          }));
          return;
        }

        try {
          const result = await imageLoader({
            url: originalImageUrl,
            cellSize,
            imageQuality,
            imageFormat,
          });

          // Update stats
          if (result.retryCount) {
            statsRef.current.retryCount += result.retryCount;
          }

          if (result.success && result.image) {
            ctx.drawImage(result.image, x, y, cellSize, cellSize);
            statsRef.current.successfulImages++;
            setState((prev) => ({
              ...prev,
              successfulImages: prev.successfulImages + 1,
            }));
            console.log(
              `Successfully drew image for ${release.basic_information.title}`,
            );
          } else {
            console.log(
              `Failed to load image for ${release.basic_information.title}: ${result.error}`,
            );
            drawPlaceholder();
            statsRef.current.failedImages++;
            setState((prev) => ({
              ...prev,
              failedImages: prev.failedImages + 1,
            }));
          }
        } catch (error) {
          console.warn(
            `Error loading image for ${release.basic_information.title}:`,
            error,
          );
          drawPlaceholder();
          statsRef.current.failedImages++;
          setState((prev) => ({
            ...prev,
            failedImages: prev.failedImages + 1,
          }));
        }
      };

      // Process images in smaller batches for faster processing
      // Adaptive batch sizing based on collection size
      let batchSize: number = MOSAIC_CONSTANTS.BATCH_SIZE;
      if (isLargeCollection) {
        batchSize = Math.max(3, Math.floor(MOSAIC_CONSTANTS.BATCH_SIZE / 2)); // Smaller batches for large collections
      }
      if (isVeryLargeCollection) {
        batchSize = Math.max(2, Math.floor(MOSAIC_CONSTANTS.BATCH_SIZE / 3)); // Even smaller batches
      }

      const totalBatches = Math.ceil(releases.length / batchSize);

      console.log(
        `Processing ${releases.length} images in ${totalBatches} batches of ${batchSize}`,
      );

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        // Check for cancellation before each batch
        if (signal.aborted) {
          console.log("Generation cancelled during batch processing");
          throw new Error("Generation cancelled");
        }

        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, releases.length);
        const batch = releases.slice(startIndex, endIndex);

        console.log(
          `Processing batch ${batchIndex + 1}/${totalBatches} (${startIndex + 1}-${endIndex})`,
        );

        const batchPromises = batch.map((release, batchItemIndex) =>
          loadImageForCanvas(release, startIndex + batchItemIndex),
        );

        try {
          await Promise.all(batchPromises);
          console.log(`Completed batch ${batchIndex + 1}/${totalBatches}`);

          // Update progress with more granular tracking
          const progress = Math.round(((batchIndex + 1) / totalBatches) * 100);
          const currentImageCount = (batchIndex + 1) * batchSize;
          const processedImages = Math.min(currentImageCount, releases.length);

          setState((prev) => ({
            ...prev,
            generationProgress: progress,
            error: null, // Clear any previous errors on successful batch
          }));

          // Log detailed progress for large collections
          if (
            isLargeCollection &&
            batchIndex % Math.ceil(totalBatches / 10) === 0
          ) {
            console.log(
              `Progress: ${progress}% (${processedImages}/${releases.length} images processed)`,
            );
          }

          // Update memory usage stats
          statsRef.current.memoryUsage = getCacheMemoryUsage();

          // Small delay between batches to prevent overwhelming the server
          if (batchIndex < totalBatches - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, MOSAIC_CONSTANTS.BATCH_DELAY),
            );
          }
        } catch (error) {
          console.error(`Error in batch ${batchIndex + 1}:`, error);

          // If it's a cancellation error, re-throw it
          if (
            error instanceof Error &&
            error.message === "Generation cancelled"
          ) {
            throw error;
          }

          // For other errors, continue with next batch but track the error
          setState((prev) => ({
            ...prev,
            error: `Batch ${batchIndex + 1} failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          }));
        }
      }

      // Add watermark footer
      addWatermarkFooter(ctx, canvasWidth, canvasHeight);

      // Convert to blob and download with optimization
      console.log("Canvas size:", canvas.width, "x", canvas.height);

      // Use selected format and quality for optimal compression
      const mimeType = imageFormat === "png" ? "image/png" : "image/jpeg";
      const quality = imageFormat === "png" ? undefined : imageQuality / 100;
      const fileExtension = imageFormat === "png" ? "png" : "jpg";

      canvas.toBlob(
        (blob) => {
          console.log("Canvas toBlob callback called, blob:", blob);
          if (blob) {
            console.log("Blob size:", blob.size, "bytes");

            // Performance tracking
            const endTime = performance.now();
            const generationTime = endTime - startTime;
            const performanceMetrics = {
              totalTime: generationTime,
              imagesPerSecond: releases.length / (generationTime / 1000),
              averageTimePerImage: generationTime / releases.length,
              successRate:
                (statsRef.current.successfulImages / releases.length) * 100,
              memoryUsage: getCacheMemoryUsage(),
            };

            console.log("Performance metrics:", performanceMetrics);

            // Track performance analytics
            trackEvent("mosaicPerformance", {
              action: "mosaicPerformance",
              category: "mosaic",
              label: "Generation Complete",
              value: Math.round(performanceMetrics.totalTime).toString(),
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `discogs-mosaic-${new Date().toISOString().split("T")[0]}.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("Download triggered successfully");
          } else {
            console.error("Canvas toBlob returned null blob");
          }
        },
        mimeType,
        quality,
      );
    } catch (error) {
      console.error("Error generating mosaic:", error);

      // Set comprehensive error state
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isGenerating: false,
      }));

      // Track error analytics
      trackEvent("mosaicError", {
        action: "mosaicError",
        category: "mosaic",
        label: "Generation Failed",
        value: errorMessage,
      });
    } finally {
      console.log("Mosaic generation completed, setting isGenerating to false");
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        generationProgress: 0,
      }));
    }
  }, [releases, imageFormat, imageQuality, aspectRatio]);

  return {
    ...state,
    canvasRef,
    downloadMosaic,
    cancelGeneration,
    stats: statsRef.current,
  };
}

// Watermark function
function addWatermarkFooter(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const watermarkText = "https://filtermydisco.gs/mosaic";
  const fontSize = Math.max(12, canvasWidth * 0.015); // Responsive font size
  const padding = 8;

  // Set font properties
  ctx.font = `${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Semi-transparent white
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  // Add subtle background for better readability
  const textMetrics = ctx.measureText(watermarkText);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  // Draw background rectangle
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(
    canvasWidth - textWidth - padding * 2,
    canvasHeight - textHeight - padding,
    textWidth + padding * 2,
    textHeight + padding,
  );

  // Draw watermark text
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillText(watermarkText, canvasWidth - padding, canvasHeight - padding);
}
