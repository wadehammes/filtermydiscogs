"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import shareStyles from "src/components/CrateShareControls/CrateShareControls.module.css";

export interface PublicLinkShareControlsViewProps {
  className?: string;
  copyControl: ReactNode | null;
  shareDescription: string;
  shareDescriptionId: string;
  shareLabelId: string;
  shareSwitch: ReactNode;
  shareSwitchId: string;
  testId: string;
  variant: "footer" | "menu";
}

export const PublicLinkShareControlsView = ({
  className,
  copyControl,
  shareDescription,
  shareDescriptionId,
  shareLabelId,
  shareSwitch,
  shareSwitchId,
  testId,
  variant,
}: PublicLinkShareControlsViewProps) => {
  if (variant === "menu") {
    return (
      <div
        className={classNames(
          shareStyles.shareRow,
          shareStyles.shareRowMenu,
          className,
        )}
        data-testid={testId}
      >
        <div className={shareStyles.shareMenuPrimary}>
          <label className={shareStyles.shareMenuLabel} htmlFor={shareSwitchId}>
            <span id={shareLabelId} className={shareStyles.shareTitle}>
              Public link
            </span>
            <span
              id={shareDescriptionId}
              className={shareStyles.shareDescription}
            >
              {shareDescription}
            </span>
          </label>
          <div className={shareStyles.shareMenuSwitchSlot}>{shareSwitch}</div>
        </div>
        {copyControl ? (
          <div className={shareStyles.shareMenuCopyRow}>{copyControl}</div>
        ) : null}
      </div>
    );
  }

  const shareActions = (
    <div className={shareStyles.shareActions}>
      {shareSwitch}
      {copyControl}
    </div>
  );

  return (
    <div
      className={classNames(
        shareStyles.shareRow,
        shareStyles.shareRowFooter,
        className,
      )}
      data-testid={testId}
    >
      <label className={shareStyles.shareLabel} htmlFor={shareSwitchId}>
        <span className={shareStyles.shareText}>
          <span id={shareLabelId} className={shareStyles.shareTitle}>
            Public link
          </span>
          <span
            id={shareDescriptionId}
            className={shareStyles.shareDescription}
          >
            {shareDescription}
          </span>
        </span>
      </label>
      {shareActions}
    </div>
  );
};
