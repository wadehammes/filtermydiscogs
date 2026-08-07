"use client";

import classNames from "classnames";
import { useEffect } from "react";
import { trackEvent } from "src/analytics/analytics";
import { ScrollModal } from "src/components/shared/ScrollModal/ScrollModal.component";
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

  if (!(isOpen && release)) {
    return null;
  }

  return (
    <ScrollModal
      ariaLabelledBy="public-release-modal-title"
      isOpen={isOpen}
      onClose={onClose}
      testId="fmdPublicReleaseModal"
      header={
        <div className={classNames(styles.heroSection)}>
          <PublicReleaseSummaryHero
            release={release}
            titleId="public-release-modal-title"
            onClose={onClose}
          />
        </div>
      }
    >
      <PublicReleaseModalBody release={release} isOpen={isOpen} />
    </ScrollModal>
  );
};
