"use client";

import classNames from "classnames";
import { type ChangeEvent, useCallback, useId } from "react";
import Button from "src/components/Button/Button.component";
import shareStyles from "src/components/CrateShareControls/CrateShareControls.module.css";
import { usePlaylistDrawerContext } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { useAuth } from "src/context/auth.context";
import { useUpdatePlaylistMutation } from "src/hooks/mutations/usePlaylistMutations";
import { usePlaylistQuery } from "src/hooks/queries/usePlaylistsQuery";
import { copyToClipboard } from "src/utils/copyToClipboard";
import { getSiteUrl } from "src/utils/helpers";
import { toast } from "src/utils/toast";
import styles from "./PlaylistShareControls.module.css";

interface PlaylistShareControlsProps {
  className?: string;
}

export const PlaylistShareControls = ({
  className,
}: PlaylistShareControlsProps) => {
  const shareSwitchId = useId();
  const shareLabelId = useId();
  const shareDescriptionId = useId();
  const { activePlaylistId } = usePlaylistDrawerContext();
  const {
    state: { userId },
  } = useAuth();
  const { data: playlist } = usePlaylistQuery({
    userId,
    playlistId: activePlaylistId,
    enabled: Boolean(activePlaylistId),
  });
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
    } else {
      toast.error("Failed to copy link to clipboard");
    }
  }, [activePlaylistId]);

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

  const copyButton = (
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
    <div
      className={classNames(
        shareStyles.shareRow,
        shareStyles.shareRowFooter,
        styles.root,
        className,
      )}
      data-testid="fmdPlaylistShareControls"
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
      <div className={shareStyles.shareActions}>
        {shareSwitch}
        {isPublic ? copyButton : null}
      </div>
    </div>
  );
};
