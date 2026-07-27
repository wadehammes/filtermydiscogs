"use client";

import classNames from "classnames";
import { useCallback, useEffect } from "react";
import { trackEvent } from "src/analytics/analytics";
import type { DiscogsRelease } from "src/types";
import { PublicReleaseModalBody } from "./PublicReleaseModalBody.component";
import { PublicReleaseSummaryHero } from "./PublicReleaseSummaryHero.component";
import styles from "./ReleaseModal.module.css";

interface PublicReleaseModalProps {
  isOpen: boolean;
  release: DiscogsRelease | null;
  onClose: () => void;
}

export const PublicReleaseModal = ({
  isOpen,
  release,
  onClose,
}: PublicReleaseModalProps) => {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen && release) {
      trackEvent("releaseClicked", {
        action: "releaseClicked",
        category: "publicReleaseModal",
        label: "Release Detail Opened",
        value: release.basic_information.resource_url,
      });
    }
  }, [isOpen, release]);

  if (!isOpen) {
    return null;
  }

  if (!release) {
    return null;
  }

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="public-release-modal-title"
      data-testid="fmdPublicReleaseModal"
    >
      <div className={styles.modal}>
        <div className={classNames(styles.header, styles.heroSection)}>
          <PublicReleaseSummaryHero
            release={release}
            titleId="public-release-modal-title"
            onClose={onClose}
          />
        </div>
        <div className={styles.content}>
          <PublicReleaseModalBody release={release} isOpen={isOpen} />
        </div>
      </div>
    </div>
  );
};
