"use client";

import { useId } from "react";
import { MOSAIC_CONSTANTS } from "src/constants/mosaic";
import styles from "./MosaicClient.module.css";

interface MosaicControlsProps {
  imageFormat: "jpeg" | "png";
  imageQuality: number;
  isGenerating: boolean;
  generationProgress: number;
  onFormatChange: (format: "jpeg" | "png") => void;
  onQualityChange: (quality: number) => void;
  onDownload: () => void;
}

export default function MosaicControls({
  imageFormat,
  imageQuality,
  isGenerating,
  generationProgress,
  onFormatChange,
  onQualityChange,
  onDownload,
}: MosaicControlsProps) {
  const formatSelectId = useId();
  const qualityRangeId = useId();

  return (
    <div className={styles.controls}>
      <div className={styles.controlsLeft}>
        <div className={styles.controlGroup}>
          <label htmlFor={formatSelectId} className={styles.controlLabel}>
            Format:
          </label>
          <select
            id={formatSelectId}
            value={imageFormat}
            onChange={(e) => onFormatChange(e.target.value as "jpeg" | "png")}
            className={styles.controlSelect}
            disabled={isGenerating}
          >
            <option value="jpeg">JPEG (Smaller file)</option>
            <option value="png">PNG (Higher quality)</option>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label htmlFor={qualityRangeId} className={styles.controlLabel}>
            Quality: {imageQuality}%
          </label>
          <input
            id={qualityRangeId}
            type="range"
            min={MOSAIC_CONSTANTS.MIN_QUALITY}
            max={MOSAIC_CONSTANTS.MAX_QUALITY}
            value={imageQuality}
            onChange={(e) => onQualityChange(parseInt(e.target.value, 10))}
            className={styles.controlRange}
            disabled={isGenerating || imageFormat === "png"}
          />
        </div>
      </div>

      <div className={styles.controlGroup}>
        <button
          type="button"
          className={styles.downloadButton}
          onClick={onDownload}
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
    </div>
  );
}
