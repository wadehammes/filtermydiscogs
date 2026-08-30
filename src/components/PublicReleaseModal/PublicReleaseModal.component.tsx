"use client";

import classNames from "classnames";
import { PublicReleaseModalBody } from "src/components/PublicReleaseModalBody/PublicReleaseModalBody.component";
import { PublicReleaseSummaryHero } from "src/components/PublicReleaseSummaryHero/PublicReleaseSummaryHero.component";
import styles from "src/components/ReleaseModal/ReleaseModal.module.css";
import { ScrollModal } from "src/components/ScrollModal/ScrollModal.component";
import type { DiscogsRelease } from "src/types";

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
  if (!(isOpen && release)) {
    return null;
  }

  return (
    <ScrollModal
      ariaLabelledBy="public-release-modal-title"
      isOpen={isOpen}
      onClose={onClose}
      testId="fmdPublicReleaseModal"
      panelClassName={styles.releaseModalPanel}
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
