import {
  trackMosaicDownload,
  trackMosaicError,
} from "src/analytics/productAnalyticsEvents";
import { calculateOptimalGrid, MOSAIC_CONSTANTS } from "src/constants/mosaic";
import { reportMosaicFailureToSentry } from "src/lib/sentry/reportMosaicFailure";
import type { DiscogsRelease } from "src/types";
import { getReleaseImageUrl } from "src/utils/helpers";
import {
  createOptimizedImageLoader,
  getCacheMemoryUsage,
  getCircuitBreakerStatus,
} from "src/utils/imageLoader";
import { buildMosaicExportFileName } from "src/utils/mosaicExport";

const isValidImageUrl = (url: string): boolean => {
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
};

export type MosaicAspectRatioKey = keyof typeof MOSAIC_CONSTANTS.ASPECT_RATIOS;

export type GenerateMosaicImageOptions = {
  releases: DiscogsRelease[];
  imageFormat: "jpeg" | "png";
  imageQuality: number;
  aspectRatio?: MosaicAspectRatioKey;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
  onImageResult?: (result: { successful: boolean }) => void;
  downloadFileName?: string;
  fileNamePrefix?: string;
};

const addWatermarkFooter = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  const watermarkText = "https://filtermydisco.gs/mosaic";
  const fontSize = Math.max(12, canvasWidth * 0.015);
  const padding = 8;

  ctx.font = `${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  const textMetrics = ctx.measureText(watermarkText);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(
    canvasWidth - textWidth - padding * 2,
    canvasHeight - textHeight - padding,
    textWidth + padding * 2,
    textHeight + padding,
  );

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillText(watermarkText, canvasWidth - padding, canvasHeight - padding);
};

const downloadCanvasBlob = (
  canvas: HTMLCanvasElement,
  imageFormat: "jpeg" | "png",
  imageQuality: number,
  fileName: string,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const mimeType = imageFormat === "png" ? "image/png" : "image/jpeg";
    const quality = imageFormat === "png" ? undefined : imageQuality / 100;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob returned null blob"));
          return;
        }

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        resolve();
      },
      mimeType,
      quality,
    );
  });

export const generateMosaicImage = async (
  canvas: HTMLCanvasElement,
  {
    releases,
    imageFormat,
    imageQuality,
    aspectRatio = "SQUARE",
    signal,
    onProgress,
    onImageResult,
    downloadFileName,
    fileNamePrefix,
  }: GenerateMosaicImageOptions,
): Promise<void> => {
  if (releases.length === 0) {
    return;
  }

  trackMosaicDownload(releases.length);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  const isLargeCollection =
    releases.length > MOSAIC_CONSTANTS.LARGE_COLLECTION_THRESHOLD;
  const isVeryLargeCollection =
    releases.length > MOSAIC_CONSTANTS.MAX_RECOMMENDED_COLLECTION_SIZE;

  if (isVeryLargeCollection) {
    console.warn(
      `Very large collection detected (${releases.length} items). Performance may be degraded.`,
    );
  }

  const aspectRatioConfig = MOSAIC_CONSTANTS.ASPECT_RATIOS[aspectRatio];
  const optimalGrid = calculateOptimalGrid(releases.length, aspectRatioConfig);

  const { cols, cellSize, canvasWidth, canvasHeight } = optimalGrid;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  ctx.fillStyle = MOSAIC_CONSTANTS.CANVAS_BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const imageLoader = createOptimizedImageLoader();

  const loadImageForCanvas = async (
    release: DiscogsRelease,
    index: number,
  ): Promise<void> => {
    if (signal?.aborted) {
      throw new Error("Generation cancelled");
    }

    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = col * cellSize;
    const y = row * cellSize;

    const originalImageUrl = getReleaseImageUrl({
      thumb: release.basic_information.thumb,
      cover_image: release.basic_information.cover_image,
      width: cellSize,
      height: cellSize,
      preferCoverImage: releases.length <= 100,
      fallbackToPlaceholder: false,
    });

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

    const reportFailure = () => {
      onImageResult?.({ successful: false });
    };

    const reportSuccess = () => {
      onImageResult?.({ successful: true });
    };

    if (!originalImageUrl) {
      drawPlaceholder();
      reportFailure();
      return;
    }

    if (!isValidImageUrl(originalImageUrl)) {
      console.warn(
        `Invalid image URL for ${release.basic_information.title}: ${originalImageUrl}`,
      );
      drawPlaceholder();
      reportFailure();
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
        reportSuccess();
      } else {
        drawPlaceholder();
        reportFailure();
      }
    } catch (error) {
      console.warn(
        `Error loading image for ${release.basic_information.title}:`,
        error,
      );
      drawPlaceholder();
      reportFailure();
    }
  };

  let batchSize: number = MOSAIC_CONSTANTS.BATCH_SIZE;
  if (isLargeCollection) {
    batchSize = Math.max(3, Math.floor(MOSAIC_CONSTANTS.BATCH_SIZE / 2));
  }
  if (isVeryLargeCollection) {
    batchSize = Math.max(2, Math.floor(MOSAIC_CONSTANTS.BATCH_SIZE / 3));
  }

  const totalBatches = Math.ceil(releases.length / batchSize);

  try {
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      if (signal?.aborted) {
        throw new Error("Generation cancelled");
      }

      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, releases.length);
      const batch = releases.slice(startIndex, endIndex);

      const batchPromises = batch.map((release, batchItemIndex) =>
        loadImageForCanvas(release, startIndex + batchItemIndex),
      );

      await Promise.all(batchPromises);

      const progress = Math.round(((batchIndex + 1) / totalBatches) * 100);
      onProgress?.(progress);

      void getCacheMemoryUsage();
      void getCircuitBreakerStatus();

      if (batchIndex < totalBatches - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, MOSAIC_CONSTANTS.BATCH_DELAY),
        );
      }
    }

    addWatermarkFooter(ctx, canvasWidth, canvasHeight);

    const fileName =
      downloadFileName ??
      buildMosaicExportFileName(imageFormat, fileNamePrefix);

    await downloadCanvasBlob(canvas, imageFormat, imageQuality, fileName);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (errorMessage !== "Generation cancelled") {
      trackMosaicError(errorMessage);
      reportMosaicFailureToSentry(error, {
        releaseCount: releases.length,
        imageFormat,
        imageQuality,
        aspectRatio,
      });
    }

    throw error;
  }
};
