"use client";

import classNames from "classnames";
import styles from "src/components/ReleaseModal/ReleaseModal.module.css";
import { ReleaseModalBody } from "src/components/ReleaseModalBody/ReleaseModalBody.component";
import { ReleaseSimilarSidebar } from "src/components/ReleaseSimilarSidebar/ReleaseSimilarSidebar.component";
import { ReleaseSummaryHero } from "src/components/ReleaseSummaryHero/ReleaseSummaryHero.component";
import { ReleaseSummaryHeroToolbar } from "src/components/ReleaseSummaryHeroToolbar/ReleaseSummaryHeroToolbar.component";
import { ScrollModal } from "src/components/ScrollModal/ScrollModal.component";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { useSimilarReleasesInCollection } from "./useSimilarReleasesInCollection.hook";

export interface ReleaseModalProps {
  isOpen: boolean;
  release: DiscogsRelease | null;
  onClose: () => void;
  onReleaseClick?: (instanceId: string) => void;
}

export const ReleaseModal = ({
  isOpen,
  release,
  onClose,
  onReleaseClick,
}: ReleaseModalProps) => {
  const { similarReleases, isSimilarLoading, canHaveSimilar } =
    useSimilarReleasesInCollection(release, isOpen);
  const showSimilarSection =
    canHaveSimilar && (isSimilarLoading || similarReleases.length > 0);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const showAsideSimilar = showSimilarSection && isDesktop;
  const showInlineSimilar = showSimilarSection && !isDesktop;

  if (!(isOpen && release)) {
    return null;
  }

  const similarSidebarProps = {
    similarReleases,
    isLoading: isSimilarLoading,
    ...definedProps({ onReleaseClick }),
  };

  return (
    <ScrollModal
      ariaLabelledBy="release-modal-title"
      isOpen={isOpen}
      onClose={onClose}
      testId="fmdReleaseModal"
      panelClassName={showSimilarSection ? styles.modalWide : undefined}
      contentClassName={showAsideSimilar ? styles.modalMain : undefined}
      aside={
        showAsideSimilar ? (
          <ReleaseSimilarSidebar variant="aside" {...similarSidebarProps} />
        ) : undefined
      }
      toolbar={
        showAsideSimilar ? (
          <ReleaseSummaryHeroToolbar release={release} onClose={onClose} />
        ) : undefined
      }
      header={
        <div className={classNames(styles.heroSection)}>
          <ReleaseSummaryHero
            release={release}
            titleId="release-modal-title"
            showToolbar={!showAsideSimilar}
            {...definedProps({
              onClose: showAsideSimilar ? undefined : onClose,
            })}
          />
        </div>
      }
    >
      <ReleaseModalBody
        release={release}
        isOpen={isOpen}
        {...definedProps({
          similarReleases: showInlineSimilar ? similarReleases : undefined,
          isSimilarLoading: showInlineSimilar ? isSimilarLoading : undefined,
          onReleaseClick: showInlineSimilar ? onReleaseClick : undefined,
        })}
      />
    </ScrollModal>
  );
};
