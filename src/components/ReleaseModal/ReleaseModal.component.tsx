"use client";

import classNames from "classnames";
import { useEffect } from "react";
import { trackEvent } from "src/analytics/analytics";
import { ScrollModal } from "src/components/shared/ScrollModal/ScrollModal.component";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseModal.module.css";
import { ReleaseModalBody } from "./ReleaseModalBody.component";
import { ReleaseSimilarSidebar } from "./ReleaseSimilarSidebar.component";
import { ReleaseSummaryHero } from "./ReleaseSummaryHero.component";
import { ReleaseSummaryHeroToolbar } from "./ReleaseSummaryHeroToolbar.component";
import { useSimilarReleasesInCollection } from "./useSimilarReleasesInCollection.hook";

interface ReleaseModalProps {
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
      panelClassName={showAsideSimilar ? styles.modalWide : undefined}
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
