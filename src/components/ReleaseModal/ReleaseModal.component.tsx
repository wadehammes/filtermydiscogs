"use client";

import classNames from "classnames";
import { useEffect } from "react";
import { trackEvent } from "src/analytics/analytics";
import { ScrollModal } from "src/components/shared/ScrollModal/ScrollModal.component";
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

  if (!(isOpen && release)) {
    return null;
  }

  return (
    <ScrollModal
      ariaLabelledBy="release-modal-title"
      isOpen={isOpen}
      onClose={onClose}
      testId="fmdReleaseModal"
      header={
        <div className={classNames(styles.heroSection)}>
          <ReleaseSummaryHero
            release={release}
            titleId="release-modal-title"
            onClose={onClose}
          />
        </div>
      }
    >
      <ReleaseModalBody release={release} isOpen={isOpen} />
    </ScrollModal>
  );
};
