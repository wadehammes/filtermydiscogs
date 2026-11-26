"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import { useCallback, useState } from "react";
import {
  InlinePopoverMenu,
  inlinePopoverMenuStyles,
} from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { InlinePopoverMenuItemIcon } from "src/components/InlinePopoverMenu/InlinePopoverMenuItemIcon.component";
import type { MosaicExportDrilldownPage } from "src/components/MosaicExportMenu/MosaicExportMenuDrilldownPanel.component";
import { MosaicExportMenuDrilldownPanel } from "src/components/MosaicExportMenu/MosaicExportMenuDrilldownPanel.component";
import ChevronRightThin from "src/styles/icons/chevron-right-thin.svg";
import MosaicIcon from "src/styles/icons/mosaic-thin.svg";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import type { MosaicImageFormat } from "src/utils/mosaicExportOptions";
import styles from "./MosaicExportMenuSubmenu.module.css";

export interface MosaicExportMenuSubmenuProps {
  releases: DiscogsRelease[];
  disabled?: boolean;
  fileNamePrefix?: string;
  onAfterExport?: () => void;
}

export const MosaicExportMenuSubmenu = ({
  releases,
  disabled = false,
  fileNamePrefix,
  onAfterExport,
}: MosaicExportMenuSubmenuProps) => {
  const [page, setPage] = useState<MosaicExportDrilldownPage>("format");
  const [selectedFormat, setSelectedFormat] =
    useState<MosaicImageFormat | null>(null);
  const releaseCount = releases.length;
  const isDisabled = disabled || releaseCount === 0;

  const resetDrilldown = useCallback(() => {
    setPage("format");
    setSelectedFormat(null);
  }, []);

  const handleSubmenuOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetDrilldown();
      }
    },
    [resetDrilldown],
  );

  const handleSelectFormat = useCallback((format: MosaicImageFormat) => {
    setSelectedFormat(format);
    setPage("aspect");
  }, []);

  const handleBackToFormats = useCallback(() => {
    setPage("format");
    setSelectedFormat(null);
  }, []);

  return (
    <Menu.SubmenuRoot onOpenChange={handleSubmenuOpenChange}>
      <Menu.SubmenuTrigger
        className={classNames(inlinePopoverMenuStyles.item, styles.trigger)}
        aria-label="Generate mosaic"
        disabled={isDisabled}
      >
        <span className={styles.triggerIcon} aria-hidden>
          <InlinePopoverMenuItemIcon>
            <MosaicIcon />
          </InlinePopoverMenuItemIcon>
        </span>
        <span className={styles.triggerLabel}>Generate mosaic</span>
        <ChevronRightThin className={styles.triggerChevron} aria-hidden />
      </Menu.SubmenuTrigger>
      <InlinePopoverMenu.Panel
        variant="submenu"
        scrollable
        popupClassName={styles.submenuPopup}
        useOverlayStack={false}
      >
        <MosaicExportMenuDrilldownPanel
          releases={releases}
          page={page}
          selectedFormat={selectedFormat}
          disabled={disabled}
          onSelectFormat={handleSelectFormat}
          onBackToFormats={handleBackToFormats}
          {...definedProps({ fileNamePrefix, onAfterExport })}
        />
      </InlinePopoverMenu.Panel>
    </Menu.SubmenuRoot>
  );
};
