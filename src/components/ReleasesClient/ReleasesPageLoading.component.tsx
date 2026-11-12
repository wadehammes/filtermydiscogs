"use client";

import { useCallback, useState } from "react";
import { Page } from "src/components/Page/Page.component";
import { CollectionPlaybackPageShell } from "src/components/PlaybackPageShell/CollectionPlaybackPageShell.component";
import { RELEASES_WORKSPACE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import { COMPACT_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useIsClient } from "src/hooks/useIsClient.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { useReleasesLoadingViewMode } from "src/hooks/useReleasesLoadingViewMode.hook";
import type { ViewMode } from "src/types/view.types";
import styles from "./ReleasesClient.module.css";
import { ReleasesHeader } from "./ReleasesHeader.component";
import { ReleasesSkeleton } from "./ReleasesSkeleton.component";

interface ReleasesPageLoadingProps {
  ssrView?: ViewMode;
}

export const ReleasesPageLoading = ({ ssrView }: ReleasesPageLoadingProps) => {
  const isClient = useIsClient();
  const isMobile = useMediaQuery(COMPACT_LAYOUT_MEDIA_QUERY);
  const resolvedView = useReleasesLoadingViewMode(
    ssrView !== undefined ? { ssrView } : {},
  );
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const showSkeleton = isClient || ssrView !== undefined;
  const displayView =
    isClient || ssrView === undefined ? resolvedView : ssrView;

  const setMainContentNode = useCallback((node: HTMLElement | null) => {
    setScrollRoot(node);
  }, []);

  return (
    <Page>
      <CollectionPlaybackPageShell
        allReleasesLoaded={false}
        currentPage="releases"
        mainClassName={styles.shellMain}
        scrollElement={scrollRoot}
      >
        <div className={styles.container} data-releases-workspace>
          <div className={styles.workspaceRow}>
            <main
              ref={setMainContentNode}
              className={styles.mainContent}
              data-releases-scroll-root
              aria-label={RELEASES_WORKSPACE_MAIN_LABEL}
            >
              <ReleasesHeader
                releaseCount={0}
                isCollectionLoading
                showAllLoadedMessage={false}
                isRandomMode={false}
                currentView={displayView}
                onViewChange={() => {}}
                onRandomClick={() => {}}
                sidePanel="crates"
                isSidePanelOpen={false}
                onSelectSidePanel={() => {}}
              />
              {showSkeleton ? (
                <ReleasesSkeleton isMobile={isMobile} view={displayView} />
              ) : null}
            </main>
          </div>
        </div>
      </CollectionPlaybackPageShell>
    </Page>
  );
};
