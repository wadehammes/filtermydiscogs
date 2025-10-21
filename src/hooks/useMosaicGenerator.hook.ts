import { useCallback, useRef, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import { MOSAIC_CONSTANTS } from "src/constants/mosaic";
import type { DiscogsRelease } from "src/types";
import { createOptimizedImageLoader } from "src/utils/imageLoader";
import type { GridDimensions } from "./useGridDimensions.hook";

interface UseMosaicGeneratorOptions {
  releases: DiscogsRelease[];
  gridDimensions: GridDimensions;
  imageFormat: "jpeg" | "png";
  imageQuality: number;
}

interface MosaicGenerationState {
  isGenerating: boolean;
  generationProgress: number;
}

export function useMosaicGenerator({
  releases,
  gridDimensions,
  imageFormat,
  imageQuality,
}: UseMosaicGeneratorOptions) {
  const [state, setState] = useState<MosaicGenerationState>({
    isGenerating: false,
    generationProgress: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const downloadMosaic = useCallback(async () => {
    console.log("Download mosaic button clicked");
    if (!canvasRef.current || releases.length === 0) {
      console.log("Early return: canvas ref or no releases");
      return;
    }

    console.log("Starting mosaic generation...");
    setState({ isGenerating: true, generationProgress: 0 });

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

      const { cols, rows } = gridDimensions;

      // Set canvas size (optimized for file size vs quality balance)
      const cellSize = MOSAIC_CONSTANTS.CANVAS_CELL_SIZE;
      const canvasWidth = cols * cellSize;
      const canvasHeight = rows * cellSize;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

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

        // If no image URL, draw placeholder immediately
        if (!originalImageUrl) {
          drawPlaceholder();
          return;
        }

        try {
          const result = await imageLoader({
            url: originalImageUrl,
            cellSize,
            imageQuality,
            imageFormat,
          });

          if (result.success && result.image) {
            ctx.drawImage(result.image, x, y, cellSize, cellSize);
            console.log(
              `Successfully drew image for ${release.basic_information.title}`,
            );
          } else {
            console.log(
              `Failed to load image for ${release.basic_information.title}: ${result.error}`,
            );
            drawPlaceholder();
          }
        } catch (error) {
          console.warn(
            `Error loading image for ${release.basic_information.title}:`,
            error,
          );
          drawPlaceholder();
        }
      };

      // Process images in smaller batches for faster processing
      const batchSize = MOSAIC_CONSTANTS.BATCH_SIZE;
      const totalBatches = Math.ceil(releases.length / batchSize);

      console.log(
        `Processing ${releases.length} images in ${totalBatches} batches of ${batchSize}`,
      );

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
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

          // Update progress
          const progress = Math.round(((batchIndex + 1) / totalBatches) * 100);
          setState((prev) => ({ ...prev, generationProgress: progress }));

          // Small delay between batches to prevent overwhelming the server
          if (batchIndex < totalBatches - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, MOSAIC_CONSTANTS.BATCH_DELAY),
            );
          }
        } catch (error) {
          console.error(`Error in batch ${batchIndex + 1}:`, error);
          // Continue with next batch even if this one fails
        }
      }

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
    } finally {
      console.log("Mosaic generation completed, setting isGenerating to false");
      setState({ isGenerating: false, generationProgress: 0 });
    }
  }, [releases, gridDimensions, imageFormat, imageQuality]);

  return {
    ...state,
    canvasRef,
    downloadMosaic,
  };
}
