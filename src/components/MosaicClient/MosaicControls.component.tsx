"use client";

import Button from "src/components/Button/Button.component";
import Select from "src/components/Select/Select.component";
import { MOSAIC_CONSTANTS } from "src/constants/mosaic";
import styles from "./MosaicClient.module.css";

interface MosaicControlsProps {
  imageFormat: "jpeg" | "png";
  aspectRatio: keyof typeof MOSAIC_CONSTANTS.ASPECT_RATIOS;
  isGenerating: boolean;
  generationProgress: number;
  onFormatChange: (format: "jpeg" | "png") => void;
  onAspectRatioChange: (
    aspectRatio: keyof typeof MOSAIC_CONSTANTS.ASPECT_RATIOS,
  ) => void;
  onDownload: () => void;
}

export default function MosaicControls({
  imageFormat,
  aspectRatio,
  isGenerating,
  generationProgress,
  onFormatChange,
  onAspectRatioChange,
  onDownload,
}: MosaicControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.controlsLeft}>
        <div className={styles.controlGroup}>
          <Select
            label="Format"
            options={[
              { value: "jpeg", label: "JPEG (Smaller file)" },
              { value: "png", label: "PNG (Higher quality)" },
            ]}
            value={imageFormat}
            onChange={(value) => onFormatChange(value as "jpeg" | "png")}
            disabled={isGenerating}
          />
        </div>

        <div className={`${styles.controlGroup} ${styles.aspectRatioGroup}`}>
          <Select
            label="Aspect Ratio"
            options={Object.entries(MOSAIC_CONSTANTS.ASPECT_RATIOS).map(
              ([key, config]) => ({
                value: key,
                label: config.name,
              }),
            )}
            value={aspectRatio}
            onChange={(value) =>
              onAspectRatioChange(
                value as keyof typeof MOSAIC_CONSTANTS.ASPECT_RATIOS,
              )
            }
            disabled={isGenerating}
          />
        </div>
      </div>

      <div className={styles.controlGroup}>
        <Button
          variant="primary"
          size="md"
          onClick={onDownload}
          disabled={isGenerating}
          isLoading={isGenerating}
          className={styles.downloadButton}
        >
          {isGenerating
            ? `Generating... ${generationProgress}%`
            : "Download Mosaic"}
        </Button>
      </div>
    </div>
  );
}
