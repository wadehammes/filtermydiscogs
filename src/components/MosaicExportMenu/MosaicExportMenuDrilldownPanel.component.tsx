"use client";

import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { InlinePopoverMenuItemIcon } from "src/components/InlinePopoverMenu/InlinePopoverMenuItemIcon.component";
import {
  type ExportMosaicParams,
  useMosaicExport,
} from "src/hooks/useMosaicExport.hook";
import ChevronLeftThin from "src/styles/icons/chevron-left-thin.svg";
import ChevronRightThin from "src/styles/icons/chevron-right-thin.svg";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import {
  listMosaicAspectRatioEntries,
  MOSAIC_IMAGE_FORMATS,
  type MosaicImageFormat,
} from "src/utils/mosaicExportOptions";
import styles from "./MosaicExportMenuDrilldownPanel.module.css";

const MOSAIC_ASPECT_RATIO_ENTRIES = listMosaicAspectRatioEntries();

export type MosaicExportDrilldownPage = "format" | "aspect";

export interface MosaicExportMenuDrilldownPanelProps {
  releases: DiscogsRelease[];
  page: MosaicExportDrilldownPage;
  selectedFormat: MosaicImageFormat | null;
  disabled?: boolean;
  fileNamePrefix?: string;
  onAfterExport?: () => void;
  onSelectFormat: (format: MosaicImageFormat) => void;
  onBackToFormats: () => void;
}

export const MosaicExportMenuDrilldownPanel = ({
  releases,
  page,
  selectedFormat,
  disabled = false,
  fileNamePrefix,
  onAfterExport,
  onSelectFormat,
  onBackToFormats,
}: MosaicExportMenuDrilldownPanelProps) => {
  const { exportMosaic, isGenerating } = useMosaicExport();
  const imageFormats = MOSAIC_IMAGE_FORMATS;
  const aspectRatioEntries = MOSAIC_ASPECT_RATIO_ENTRIES;
  const releaseCount = releases.length;
  const isDisabled = disabled || releaseCount === 0 || isGenerating;

  const runExport = (params: Omit<ExportMosaicParams, "releases">) => {
    void exportMosaic({
      releases,
      ...params,
      ...definedProps({ fileNamePrefix }),
    });
    onAfterExport?.();
  };

  const selectedFormatLabel =
    imageFormats.find((format) => format.value === selectedFormat)?.label ??
    "Format";

  return (
    <>
      <InlinePopoverMenu.Heading className={styles.submenuHeading}>
        {page === "format"
          ? "Choose format"
          : `${selectedFormatLabel} · aspect`}
      </InlinePopoverMenu.Heading>
      <div
        className={styles.viewport}
        data-activation-direction={
          page === "aspect" ? "right" : page === "format" ? "left" : undefined
        }
      >
        <div className={styles.track} data-page={page}>
          <div className={styles.page}>
            <InlinePopoverMenu.List>
              {imageFormats.map((format) => (
                <InlinePopoverMenu.Item
                  key={format.value}
                  disabled={isDisabled}
                  closeOnClick={false}
                  onClick={() => {
                    onSelectFormat(format.value);
                  }}
                >
                  <span className={styles.formatLabel}>{format.label}</span>
                  <ChevronRightThin className={styles.rowChevron} aria-hidden />
                </InlinePopoverMenu.Item>
              ))}
            </InlinePopoverMenu.List>
          </div>
          <div className={styles.page}>
            <InlinePopoverMenu.List>
              <InlinePopoverMenu.Item
                className={styles.backItem}
                closeOnClick={false}
                disabled={isDisabled}
                onClick={onBackToFormats}
              >
                <InlinePopoverMenuItemIcon>
                  <ChevronLeftThin />
                </InlinePopoverMenuItemIcon>
                <span>Back</span>
              </InlinePopoverMenu.Item>
              {selectedFormat
                ? aspectRatioEntries.map(([aspectKey, config]) => (
                    <InlinePopoverMenu.Item
                      key={aspectKey}
                      disabled={isDisabled}
                      onClick={() => {
                        runExport({
                          imageFormat: selectedFormat,
                          aspectRatio: aspectKey,
                        });
                      }}
                    >
                      {config.name}
                    </InlinePopoverMenu.Item>
                  ))
                : null}
            </InlinePopoverMenu.List>
          </div>
        </div>
      </div>
    </>
  );
};
