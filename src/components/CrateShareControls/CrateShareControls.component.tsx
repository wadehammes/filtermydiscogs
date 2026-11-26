"use client";

import { type ChangeEvent, useId } from "react";
import Button from "src/components/Button/Button.component";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { PublicLinkShareControlsView } from "src/components/ShareControls/PublicLinkShareControlsView.component";
import { definedProps } from "src/utils/definedProps";
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
      data-1p-ignore
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

  return (
    <PublicLinkShareControlsView
      {...definedProps({ className })}
      copyControl={isPublic ? copyButton : null}
      shareDescription={shareDescription}
      shareDescriptionId={shareDescriptionId}
      shareLabelId={shareLabelId}
      shareSwitch={shareSwitch}
      shareSwitchId={shareSwitchId}
      testId="fmdCrateShareControls"
      variant={variant}
    />
  );
};
