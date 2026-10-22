"use client";

import { useCallback, useState } from "react";
import { Page } from "src/components/Page/Page.component";
import { CollectionPlaybackPageShell } from "src/components/PlaybackPageShell/CollectionPlaybackPageShell.component";
import { RELEASES_WORKSPACE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import { COMPACT_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import styles from "./ReleasesClient.module.css";
import { ReleasesHeader } from "./ReleasesHeader.component";
import { ReleasesSkeleton } from "./ReleasesSkeleton.component";

export const ReleasesPageLoading = () => {
  const isMobile = useMediaQuery(COMPACT_LAYOUT_MEDIA_QUERY);
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

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
                currentView="card"
                onViewChange={() => {}}
                onRandomClick={() => {}}
                sidePanel="crates"
                isSidePanelOpen={false}
                onSelectSidePanel={() => {}}
              />
              <ReleasesSkeleton isMobile={isMobile} />
            </main>
          </div>
        </div>
      </CollectionPlaybackPageShell>
    </Page>
  );
};
