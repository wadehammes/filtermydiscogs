"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CrateDrawerProvider,
  useCrateDrawerContext,
} from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerDialogs } from "src/components/CrateDrawer/CrateDrawerDialogs.component";
import { CrateReleaseListToolbar } from "src/components/CrateDrawer/CrateReleaseListToolbar.component";
import { CrateSetNotesScratchpad } from "src/components/CrateDrawer/CrateSetNotesScratchpad.component";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { ReleaseModal } from "src/components/ReleaseModal/ReleaseModal.component";
import { PlaybackPageShell } from "src/components/ReleasePlayback/PlaybackPageShell.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useCrate } from "src/context/crate.context";
import { useRegisterPlaybackReleaseClick } from "src/context/playbackReleaseClick.context";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import { countVisibleCrateReleases } from "src/lib/crate-layout";
import styles from "./CrateDetailClient.module.css";
import { CrateDetailHeader } from "./CrateDetailHeader.component";
import { CrateLayoutList } from "./CrateLayoutList.component";

interface CrateDetailClientProps {
  crateId: string;
}

interface CrateDetailWorkspaceProps {
  onReleaseClick: (instanceId: string) => void;
}

const CrateDetailWorkspace = ({
  onReleaseClick,
}: CrateDetailWorkspaceProps) => {
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

  const [topInsertMount, setTopInsertMount] = useState<HTMLElement | null>(
    null,
  );
  const [bottomInsertMount, setBottomInsertMount] =
    useState<HTMLElement | null>(null);

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
      onReleaseClick={onReleaseClick}
      topInsertMount={topInsertMount}
      bottomInsertMount={bottomInsertMount}
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
            <div className={styles.releasesPanelToolbarWrap}>
              <CrateReleaseListToolbar
                className={styles.releasesPanelToolbar}
              />
              <div
                ref={setTopInsertMount}
                className={styles.releasesPanelEdgeInsertMount}
                data-testid="fmdCrateLayoutTopInsertMount"
              />
            </div>
            <div className={styles.releasesPanelBody}>{releasesContent}</div>
            <div
              ref={setBottomInsertMount}
              className={styles.releasesPanelEdgeInsertMount}
              data-testid="fmdCrateLayoutBottomInsertMount"
            />
          </div>
        </div>
      </div>

      <CrateDrawerDialogs />
    </div>
  );
};

function CrateDetailClientContent({ crateId }: CrateDetailClientProps) {
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const { crates, isLoading, selectCrate, selectedReleases } = useCrate();
  const { selectedRelease, handleReleaseClick, handleCloseModal } =
    useSelectedReleaseModal(selectedReleases);

  useRegisterPlaybackReleaseClick(handleReleaseClick);

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
    <PlaybackPageShell
      fillViewport
      header={
        <StickyHeaderBar
          allReleasesLoaded={true}
          currentPage="crates"
          hideFilters={true}
        />
      }
      overlays={
        <ReleaseModal
          isOpen={selectedRelease !== null}
          release={selectedRelease}
          onClose={handleCloseModal}
          onReleaseClick={handleReleaseClick}
        />
      }
    >
      <main className={styles.page} data-testid="fmdCrateDetailClient">
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
            <CrateDrawerProvider onReleaseClick={handleReleaseClick}>
              <CrateDetailWorkspace onReleaseClick={handleReleaseClick} />
            </CrateDrawerProvider>
          )}
        </div>
      </main>
    </PlaybackPageShell>
  );
}

export default function CrateDetailClient({ crateId }: CrateDetailClientProps) {
  return <CrateDetailClientContent crateId={crateId} />;
}
