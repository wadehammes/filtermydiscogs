import { useCallback, useRef, useState } from "react";
import { MOSAIC_CONSTANTS } from "src/constants/mosaic";
import type { DiscogsRelease } from "src/types";
import {
  generateMosaicImage,
  type MosaicAspectRatioKey,
} from "src/utils/generateMosaicImage";
import {
  getCacheMemoryUsage,
  getCircuitBreakerStatus,
} from "src/utils/imageLoader";

interface UseMosaicGeneratorOptions {
  releases: DiscogsRelease[];
  imageFormat: "jpeg" | "png";
  imageQuality: number;
  aspectRatio?: MosaicAspectRatioKey;
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

export const useMosaicGenerator = ({
  releases,
  imageFormat,
  imageQuality,
  aspectRatio = "SQUARE",
}: UseMosaicGeneratorOptions) => {
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
    if (!canvasRef.current || releases.length === 0) {
      return;
    }

    const isVeryLargeCollection =
      releases.length > MOSAIC_CONSTANTS.MAX_RECOMMENDED_COLLECTION_SIZE;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState({
      isGenerating: true,
      generationProgress: 0,
      error: null,
      isCancelled: false,
      failedImages: 0,
      successfulImages: 0,
    });

    statsRef.current = {
      totalImages: releases.length,
      successfulImages: 0,
      failedImages: 0,
      cacheHits: 0,
      retryCount: 0,
      circuitBreakerStatus: getCircuitBreakerStatus(),
      memoryUsage: getCacheMemoryUsage(),
    };

    if (isVeryLargeCollection) {
      setState((prev) => ({
        ...prev,
        error: `Warning: Very large collection (${releases.length} items) may cause performance issues. Consider using filters to reduce the number of items.`,
      }));
    }

    try {
      await generateMosaicImage(canvasRef.current, {
        releases,
        imageFormat,
        imageQuality,
        aspectRatio,
        signal,
        onProgress: (progress) => {
          setState((prev) => ({
            ...prev,
            generationProgress: progress,
            error: null,
          }));
          statsRef.current.memoryUsage = getCacheMemoryUsage();
        },
        onImageResult: ({ successful }) => {
          if (successful) {
            statsRef.current.successfulImages++;
            setState((prev) => ({
              ...prev,
              successfulImages: prev.successfulImages + 1,
            }));
          } else {
            statsRef.current.failedImages++;
            setState((prev) => ({
              ...prev,
              failedImages: prev.failedImages + 1,
            }));
          }
        },
      });
    } catch (error) {
      console.error("Error generating mosaic:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      if (errorMessage === "Generation cancelled") {
        setState((prev) => ({
          ...prev,
          isCancelled: true,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
      }
    } finally {
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
};
