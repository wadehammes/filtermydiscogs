"use client";

import classNames from "classnames";
import { useCallback, useEffect } from "react";
import { trackEvent } from "src/analytics/analytics";
import type { DiscogsRelease } from "src/types";
import styles from "./ReleaseModal.module.css";
import { ReleaseModalBody } from "./ReleaseModalBody.component";
import { ReleaseSummaryHero } from "./ReleaseSummaryHero.component";

interface ReleaseModalProps {
  isOpen: boolean;
  release: DiscogsRelease | null;
  onClose: () => void;
}

export const ReleaseModal = ({
  isOpen,
  release,
  onClose,
}: ReleaseModalProps) => {
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
        category: "releaseModal",
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
      aria-labelledby="release-modal-title"
      data-testid="fmdReleaseModal"
    >
      <div className={styles.modal}>
        <div className={classNames(styles.header, styles.heroSection)}>
          <ReleaseSummaryHero
            release={release}
            titleId="release-modal-title"
            onClose={onClose}
          />
        </div>
        <div className={styles.content}>
          <ReleaseModalBody release={release} isOpen={isOpen} />
        </div>
      </div>
    </div>
  );
};
