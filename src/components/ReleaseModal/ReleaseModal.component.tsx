"use client";

import classNames from "classnames";
import styles from "src/components/ReleaseModal/ReleaseModal.module.css";
import { ReleaseModalBody } from "src/components/ReleaseModalBody/ReleaseModalBody.component";
import { ReleaseSimilarSidebar } from "src/components/ReleaseSimilarSidebar/ReleaseSimilarSidebar.component";
import { ReleaseSummaryHero } from "src/components/ReleaseSummaryHero/ReleaseSummaryHero.component";
import { ReleaseSummaryHeroToolbar } from "src/components/ReleaseSummaryHeroToolbar/ReleaseSummaryHeroToolbar.component";
import { ScrollModal } from "src/components/ScrollModal/ScrollModal.component";
import { DESKTOP_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { definedProps } from "src/utils/definedProps";
import type { ReleaseModalProps } from "./ReleaseModal.types";
import { useSimilarReleasesInCollection } from "./useSimilarReleasesInCollection.hook";

export type { ReleaseModalProps } from "./ReleaseModal.types";

export const ReleaseModal = ({
  isOpen,
  release,
  onClose,
  onReleaseClick,
}: ReleaseModalProps) => {
  const {
    similarReleases,
    totalSimilarMatchCount,
    isSimilarLoading,
    canHaveSimilar,
    canShuffleSimilarReleases,
    shuffleSimilarReleases,
  } = useSimilarReleasesInCollection(release, isOpen);
  const showSimilarSection =
    canHaveSimilar && (isSimilarLoading || similarReleases.length > 0);
  const isDesktop = useMediaQuery(DESKTOP_LAYOUT_MEDIA_QUERY);
  const showAsideSimilar = showSimilarSection && isDesktop;
  const showInlineSimilar = showSimilarSection && !isDesktop;

  if (!(isOpen && release)) {
    return null;
  }

  const similarSidebarShellProps = {
    similarReleases,
    totalSimilarMatchCount,
    canShuffleSimilarReleases,
    ...definedProps({
      onReleaseClick,
      onShuffleSimilarReleases: shuffleSimilarReleases,
    }),
  };

  return (
    <ScrollModal
      ariaLabelledBy="release-modal-title"
      isOpen={isOpen}
      onClose={onClose}
      testId="fmdReleaseModal"
      escapeStackingContext
      panelClassName={showSimilarSection ? styles.modalWide : undefined}
      contentClassName={
        showAsideSimilar
          ? classNames(styles.modalScrollContent, styles.modalMain)
          : styles.modalScrollContent
      }
      aside={
        showAsideSimilar ? (
          <ReleaseSimilarSidebar
            variant="aside"
            isLoading={isSimilarLoading}
            {...similarSidebarShellProps}
          />
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
        {...definedProps(
          showInlineSimilar
            ? {
                ...similarSidebarShellProps,
                isSimilarLoading,
              }
            : {
                onReleaseClick,
              },
        )}
      />
    </ScrollModal>
  );
};
