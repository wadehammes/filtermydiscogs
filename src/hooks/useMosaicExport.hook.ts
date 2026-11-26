"use client";

import { useCallback, useRef, useState } from "react";
import { MOSAIC_CONSTANTS } from "src/constants/mosaic";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import {
  generateMosaicImage,
  type MosaicAspectRatioKey,
} from "src/utils/generateMosaicImage";
import { toast } from "src/utils/toast";

export type ExportMosaicParams = {
  releases: DiscogsRelease[];
  imageFormat: "jpeg" | "png";
  aspectRatio: MosaicAspectRatioKey;
  fileNamePrefix?: string;
  imageQuality?: number;
};

export const useMosaicExport = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const isGeneratingRef = useRef(false);

  const exportMosaic = useCallback(
    async ({
      releases,
      imageFormat,
      aspectRatio,
      fileNamePrefix,
      imageQuality = MOSAIC_CONSTANTS.DEFAULT_QUALITY,
    }: ExportMosaicParams) => {
      if (releases.length === 0) {
        toast.error("No releases to export");
        return;
      }

      if (isGeneratingRef.current) {
        return;
      }

      const canvas = document.createElement("canvas");
      abortRef.current = new AbortController();
      isGeneratingRef.current = true;
      setIsGenerating(true);

      const toastId = toast.loading("Generating mosaic…");

      try {
        await generateMosaicImage(canvas, {
          releases,
          imageFormat,
          imageQuality,
          aspectRatio,
          signal: abortRef.current.signal,
          ...definedProps({ fileNamePrefix }),
        });
        toast.success("Mosaic downloaded", { id: toastId });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";

        if (message === "Generation cancelled") {
          toast.dismiss(toastId);
        } else {
          toast.error("Failed to generate mosaic", { id: toastId });
        }
      } finally {
        isGeneratingRef.current = false;
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [],
  );

  return { exportMosaic, isGenerating };
};
