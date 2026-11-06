"use client";

import classNames from "classnames";
import { useCallback } from "react";
import { IconButton } from "src/components/IconButton/IconButton.component";
import modalToolbarStyles from "src/components/ModalToolbar/ModalToolbar.module.css";
import CopyLinkListenIcon from "src/styles/icons/copy-link-thin.svg";
import type { DiscogsRelease } from "src/types";
import { copyToClipboard } from "src/utils/copyToClipboard";
import { getSiteUrl } from "src/utils/helpers";
import { parseReleaseId } from "src/utils/releaseNotes";
import { toast } from "src/utils/toast";

const COPY_LISTEN_LINK_LABEL = "Copy listen link";

interface ReleaseSummaryHeroCopyListenLinkButtonProps {
  release: DiscogsRelease;
}

export const ReleaseSummaryHeroCopyListenLinkButton = ({
  release,
}: ReleaseSummaryHeroCopyListenLinkButtonProps) => {
  const releaseId = parseReleaseId(release);

  const handleClick = useCallback(async () => {
    if (releaseId === null) {
      return;
    }

    const listenUrl = `${getSiteUrl()}/release/${releaseId}`;
    const success = await copyToClipboard(listenUrl);

    if (success) {
      toast.success("Link copied to clipboard");
    } else {
      toast.error("Failed to copy link to clipboard");
    }
  }, [releaseId]);

  if (releaseId === null) {
    return null;
  }

  return (
    <IconButton
      type="button"
      variant="default"
      className={classNames(modalToolbarStyles.actionButton)}
      aria-label={COPY_LISTEN_LINK_LABEL}
      title={COPY_LISTEN_LINK_LABEL}
      iconClassName={modalToolbarStyles.actionIcon}
      onClick={() => {
        void handleClick();
      }}
    >
      <CopyLinkListenIcon />
    </IconButton>
  );
};
