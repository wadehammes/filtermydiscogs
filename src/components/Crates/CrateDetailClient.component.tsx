"use client";

import classNames from "classnames";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import {
  CrateDrawerProvider,
  useCrateDrawerContext,
} from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerDialogs } from "src/components/CrateDrawer/CrateDrawerDialogs.component";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { ReleaseModal } from "src/components/ReleaseModal/ReleaseModal.component";
import { ReleaseMiniPlayer } from "src/components/ReleasePlayback/ReleaseMiniPlayer.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useCrate } from "src/context/crate.context";
import {
  ReleasePlaybackProvider,
  useReleasePlayback,
} from "src/context/releasePlayback.context";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import { countVisibleCrateReleases } from "src/lib/crate-layout";
import { definedProps } from "src/utils/definedProps";
import styles from "./CrateDetailClient.module.css";
import { CrateDetailHeader } from "./CrateDetailHeader.component";
import { CrateLayoutList } from "./CrateLayoutList.component";
import { CrateReleaseListToolbar } from "./CrateReleaseListToolbar.component";
import { CrateSetNotesScratchpad } from "./CrateSetNotesScratchpad.component";

interface CrateDetailClientProps {
  crateId: string;
}

const CrateDetailWorkspace = () => {
  const {
    activeCrateId,
    hidePackedItems,
    isPacked,
    layoutItems,
    packedEnabled,
    removeFromCrate,
    selectedReleases,
    setPacked,
  } = useCrateDrawerContext();

  const {
    selectedRelease,
    selectedReleaseId,
    handleReleaseClick,
    handleCloseModal,
  } = useSelectedReleaseModal(selectedReleases);

  const visibleReleaseCount = useMemo(
    () =>
      countVisibleCrateReleases({
        items: layoutItems,
        hidePackedItems,
        isPacked,
        packedEnabled,
      }),
    [hidePackedItems, isPacked, layoutItems, packedEnabled],
  );

  const showAllPackedState =
    packedEnabled && visibleReleaseCount === 0 && selectedReleases.length > 0;

  const releasesContent = showAllPackedState ? (
    <div className={styles.emptyState}>
      <p>All albums packed for your gig.</p>
    </div>
  ) : activeCrateId ? (
    <CrateLayoutList
      crateId={activeCrateId}
      layoutItems={layoutItems}
      hidePackedItems={hidePackedItems}
      packedEnabled={packedEnabled}
      isPacked={isPacked}
      setPacked={setPacked}
      removeFromCrate={removeFromCrate}
      onReleaseClick={handleReleaseClick}
    />
  ) : null;

  return (
    <div className={styles.detailMain}>
      <CrateDetailHeader />

      <div className={styles.workspace}>
        <aside className={styles.notesColumn}>
          <div className={styles.notesPanel}>
            <CrateSetNotesScratchpad variant="panel" />
          </div>
        </aside>

        <div className={styles.releasesColumn}>
          <div className={styles.releasesPanel}>
            <CrateReleaseListToolbar className={styles.releasesPanelToolbar} />
            <div className={styles.releasesPanelBody}>{releasesContent}</div>
          </div>
        </div>
      </div>

      <CrateDrawerDialogs />
      <ReleaseModal
        isOpen={selectedReleaseId !== null}
        release={selectedRelease}
        onClose={handleCloseModal}
      />
      <ReleaseMiniPlayer
        {...definedProps({ onReleaseClick: handleReleaseClick })}
      />
    </div>
  );
};

function CrateDetailClientContent({ crateId }: CrateDetailClientProps) {
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const { crates, isLoading, selectCrate } = useCrate();
  const { isPlaying } = useReleasePlayback();

  useEffect(() => {
    if (crateId) {
      selectCrate(crateId);
    }
  }, [crateId, selectCrate]);

  const crateExists = crates.some((crate) => crate.id === crateId);

  if (shouldRedirectHome || isCheckingAuth) {
    return null;
  }

  return (
    <div
      className={classNames(styles.pageShell, {
        [styles.withMiniPlayer]: isPlaying,
      })}
      data-testid="fmdCrateDetailClient"
    >
      <StickyHeaderBar
        allReleasesLoaded={true}
        currentPage="crates"
        hideFilters={true}
      />
      <main className={styles.page}>
        <div className={styles.container}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <PageLoader message="Loading crate..." />
            </div>
          ) : !crateExists ? (
            <div className={styles.emptyState}>
              <p>Crate not found.</p>
              <Link href="/crates" className={styles.backLink}>
                ← Back to crates
              </Link>
            </div>
          ) : (
            <CrateDrawerProvider>
              <CrateDetailWorkspace />
            </CrateDrawerProvider>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CrateDetailClient({ crateId }: CrateDetailClientProps) {
  return (
    <ReleasePlaybackProvider>
      <CrateDetailClientContent crateId={crateId} />
    </ReleasePlaybackProvider>
  );
}
