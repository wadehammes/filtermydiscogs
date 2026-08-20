"use client";

import classNames from "classnames";
import { type ChangeEvent, useId } from "react";
import Button from "src/components/Button/Button.component";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import styles from "./CrateShareControls.module.css";

interface CrateShareControlsProps {
  variant: "footer" | "menu";
  className?: string;
  onAfterCopy?: () => void;
}

export const CrateShareControls = ({
  variant,
  className,
  onAfterCopy,
}: CrateShareControlsProps) => {
  const {
    activeCrateId,
    handleCopyLink,
    handleSetCratePublic,
    isDeletingCrate,
    isPublic,
    isUpdatingCrate,
  } = useCrateDrawerContext();

  const shareSwitchId = useId();
  const shareLabelId = useId();
  const shareDescriptionId = useId();
  const isBusy = isUpdatingCrate || isDeletingCrate;
  const isDisabled = isBusy || !activeCrateId;
  const shareDescription = isPublic
    ? "Anyone with the link can view this crate."
    : "Only you can view this crate.";
  const copyLabel = "Copy link";

  const handleCopyPress = () => {
    void handleCopyLink();
    onAfterCopy?.();
  };

  const handlePublicChange = (event: ChangeEvent<HTMLInputElement>) => {
    void handleSetCratePublic(event.target.checked);
  };

  const copyButton =
    variant === "menu" ? (
      <button
        type="button"
        role="menuitem"
        className={styles.inlineCopyButton}
        disabled={isDisabled}
        onClick={handleCopyPress}
      >
        {copyLabel}
      </button>
    ) : (
      <Button
        variant="secondary"
        size="sm"
        className={styles.inlineCopyButton}
        onPress={handleCopyPress}
        disabled={isDisabled}
      >
        {copyLabel}
      </Button>
    );

  const shareSwitch = (
    <input
      id={shareSwitchId}
      type="checkbox"
      role="switch"
      className={styles.shareSwitch}
      checked={isPublic}
      aria-checked={isPublic}
      disabled={isDisabled}
      aria-labelledby={`${shareLabelId} ${shareDescriptionId}`}
      onChange={handlePublicChange}
    />
  );

  const shareActions = (
    <div className={styles.shareActions}>
      {shareSwitch}
      {isPublic ? copyButton : null}
    </div>
  );

  if (variant === "menu") {
    return (
      <div
        className={classNames(styles.shareRow, styles.shareRowMenu, className)}
      >
        <div className={styles.shareMenuHeader}>
          <label className={styles.shareMenuTitle} htmlFor={shareSwitchId}>
            <span id={shareLabelId}>Public link</span>
          </label>
          {shareActions}
        </div>
        <p id={shareDescriptionId} className={styles.shareDescription}>
          {shareDescription}
        </p>
      </div>
    );
  }

  return (
    <div
      className={classNames(styles.shareRow, styles.shareRowFooter, className)}
    >
      <label className={styles.shareLabel} htmlFor={shareSwitchId}>
        <span className={styles.shareText}>
          <span id={shareLabelId} className={styles.shareTitle}>
            Public link
          </span>
          <span id={shareDescriptionId} className={styles.shareDescription}>
            {shareDescription}
          </span>
        </span>
      </label>
      {shareActions}
    </div>
  );
};
