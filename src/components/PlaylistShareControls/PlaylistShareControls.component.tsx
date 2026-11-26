"use client";

import { type ChangeEvent, useCallback, useId } from "react";
import Button from "src/components/Button/Button.component";
import shareStyles from "src/components/CrateShareControls/CrateShareControls.module.css";
import { usePlaylistDrawerContext } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PublicLinkShareControlsView } from "src/components/ShareControls/PublicLinkShareControlsView.component";
import { useUpdatePlaylistMutation } from "src/hooks/mutations/usePlaylistMutations";
import { useActivePlaylistDetail } from "src/hooks/useActivePlaylistDetail.hook";
import { copyToClipboard } from "src/utils/copyToClipboard";
import { definedProps } from "src/utils/definedProps";
import { getSiteUrl } from "src/utils/helpers";
import { toast } from "src/utils/toast";

interface PlaylistShareControlsProps {
  className?: string;
  onAfterCopy?: () => void;
  variant?: "footer" | "menu";
}

export const PlaylistShareControls = ({
  className,
  onAfterCopy,
  variant = "footer",
}: PlaylistShareControlsProps) => {
  const shareSwitchId = useId();
  const shareLabelId = useId();
  const shareDescriptionId = useId();
  const { activePlaylistId } = usePlaylistDrawerContext();
  const { data: playlist } = useActivePlaylistDetail();
  const updatePlaylistMutation = useUpdatePlaylistMutation();
  const isPublic = playlist?.private === false;
  const isDisabled =
    !(activePlaylistId && playlist) || updatePlaylistMutation.isPending;
  const shareDescription = isPublic
    ? "Anyone with the link can view this playlist."
    : "Only you can view this playlist.";

  const handleCopyPress = useCallback(async () => {
    if (!activePlaylistId) {
      return;
    }

    const playlistUrl = `${getSiteUrl()}/playlist/${activePlaylistId}`;
    const success = await copyToClipboard(playlistUrl);

    if (success) {
      toast.success("Link copied to clipboard");
      onAfterCopy?.();
    } else {
      toast.error("Failed to copy link to clipboard");
    }
  }, [activePlaylistId, onAfterCopy]);

  const handlePublicChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!activePlaylistId) {
      return;
    }

    void updatePlaylistMutation.mutateAsync({
      playlistId: activePlaylistId,
      payload: { private: !event.target.checked },
    });
  };

  const shareSwitch = (
    <input
      data-1p-ignore
      id={shareSwitchId}
      type="checkbox"
      role="switch"
      className={shareStyles.shareSwitch}
      checked={isPublic}
      aria-checked={isPublic}
      disabled={isDisabled}
      aria-labelledby={`${shareLabelId} ${shareDescriptionId}`}
      onChange={handlePublicChange}
    />
  );

  const copyButton =
    variant === "menu" ? (
      <button
        type="button"
        className={shareStyles.inlineCopyButton}
        disabled={isDisabled}
        onClick={() => {
          void handleCopyPress();
        }}
      >
        Copy link
      </button>
    ) : (
      <Button
        variant="secondary"
        size="sm"
        className={shareStyles.inlineCopyButton}
        onPress={() => {
          void handleCopyPress();
        }}
        disabled={isDisabled}
      >
        Copy link
      </Button>
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
      testId="fmdPlaylistShareControls"
      variant={variant}
    />
  );
};
