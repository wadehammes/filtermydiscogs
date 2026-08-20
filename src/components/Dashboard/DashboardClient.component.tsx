"use client";

import { useEffect, useMemo } from "react";
import appLoadingStyles from "src/components/AppPageLoading/AppPageLoading.module.css";
import { Page } from "src/components/Page/Page.component";
import { PlaybackPageShell } from "src/components/PlaybackPageShell/PlaybackPageShell.component";
import { ReleaseModal } from "src/components/ReleaseModal/ReleaseModal.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useAuth } from "src/context/auth.context";
import { useRegisterPlaybackReleaseClick } from "src/context/playbackReleaseClick.context";
import { useCollectionValueQuery } from "src/hooks/queries/useCollectionValueQuery";
import { useCollectionAnalytics } from "src/hooks/useCollectionAnalytics.hook";
import { useCollectionLoadState } from "src/hooks/useCollectionData.hook";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useNeedsCollectionLoad } from "src/hooks/useNeedsCollectionLoad.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import { buildDashboardStory } from "src/utils/dashboardStory";
import { isLocalDevHost } from "src/utils/isLocalDevHost";
import { ArtistLabelCharts } from "./ArtistLabelCharts.component";
import { CollectionHealth } from "./CollectionHealth.component";
import { CollectionMilestones } from "./CollectionMilestones.component";
import { CollectionRhythm } from "./CollectionRhythm.component";
import { ComparativeGrowthCharts } from "./ComparativeGrowthCharts.component";
import styles from "./DashboardClient.module.css";
import { DashboardHero } from "./DashboardHero.component";
import { DashboardSection } from "./DashboardSection.component";
import { DashboardSkeleton } from "./DashboardSkeleton.component";
import { DistributionCharts } from "./DistributionCharts.component";
import { GrowthChart } from "./GrowthChart.component";
import { MostCrated } from "./MostCrated.component";
import { OnThisDay } from "./OnThisDay.component";
import { StyleEvolution } from "./StyleEvolution.component";

function DashboardClientContent() {
  const { state: authState } = useAuth();
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const {
    isLoading: collectionLoading,
    hasNextPage,
    isFetchingNextPage,
  } = useCollectionLoadState();
  const needsCollectionLoad = useNeedsCollectionLoad({
    isLoading: collectionLoading,
    hasNextPage,
    isFetchingNextPage,
  });
  const allReleases = useAllReleases();
  const showLoading = isCheckingAuth || needsCollectionLoad;
  const { selectedRelease, handleReleaseClick, handleCloseModal } =
    useSelectedReleaseModal(allReleases);

  useRegisterPlaybackReleaseClick(handleReleaseClick);

  const analytics = useCollectionAnalytics();
  const {
    data: collectionValue,
    isLoading: valueLoading,
    error: valueError,
  } = useCollectionValueQuery({ username: authState.username });

  const story = useMemo(() => {
    if (!analytics) {
      return null;
    }

    return buildDashboardStory({
      analytics,
      releases: allReleases,
      username: authState.username,
    });
  }, [analytics, allReleases, authState.username]);

  useEffect(() => {
    if (valueError && isLocalDevHost()) {
      console.error("Collection value error:", valueError);
    }
  }, [valueError]);

  if (shouldRedirectHome) {
    return null;
  }

  if (showLoading) {
    return (
      <Page>
        <PlaybackPageShell
          fillViewport
          header={
            <StickyHeaderBar
              allReleasesLoaded={false}
              currentPage="dashboard"
              hideFilters={true}
            />
          }
        >
          <div className={appLoadingStyles.contentWithSkeleton}>
            <div className={styles.container}>
              <DashboardSkeleton />
            </div>
          </div>
        </PlaybackPageShell>
      </Page>
    );
  }

  return (
    <>
      <Page>
        <PlaybackPageShell
          fillViewport
          header={
            <StickyHeaderBar
              allReleasesLoaded={true}
              currentPage="dashboard"
              hideFilters={true}
            />
          }
        >
          <div className={styles.container} data-testid="fmdDashboardClient">
            {!(collectionLoading || analytics) && (
              <div className={styles.emptyState}>
                <h1>Nothing on the shelf yet</h1>
                <p>Add records to your Discogs collection to see them here.</p>
              </div>
            )}

            {!collectionLoading && analytics && story && (
              <div className={styles.content}>
                <DashboardHero
                  story={story}
                  stats={analytics.stats}
                  collectionValue={collectionValue}
                  isLoadingValue={valueLoading}
                  valueError={valueError}
                />

                <DashboardSection
                  lede={story.sections.today.lede}
                  title={story.sections.today.title}
                >
                  <OnThisDay
                    hideHeading={true}
                    onReleaseClick={handleReleaseClick}
                  />
                </DashboardSection>

                <DashboardSection
                  lede={story.sections.growth.lede}
                  title={story.sections.growth.title}
                >
                  <CollectionRhythm
                    acquisitionStreaks={analytics.acquisitionStreaks}
                  />
                  <GrowthChart
                    growthData={analytics.growth}
                    hideHeading={true}
                  />
                </DashboardSection>

                <DashboardSection
                  lede={story.sections.sound.lede}
                  title={story.sections.sound.title}
                >
                  <DistributionCharts
                    styleDistribution={analytics.styleDistribution}
                    genreDistribution={analytics.genreDistribution}
                    decadeDistribution={analytics.decadeDistribution}
                    mediaTypeDistribution={analytics.mediaTypeDistribution}
                    formatTagDistribution={analytics.formatTagDistribution}
                  />
                  <ComparativeGrowthCharts hideHeading={true} />
                  <StyleEvolution
                    hideHeading={true}
                    sectionCopy={story.sections.styleEvolution}
                  />
                </DashboardSection>

                <DashboardSection
                  lede={story.sections.names.lede}
                  title={story.sections.names.title}
                >
                  <ArtistLabelCharts
                    artistDistribution={analytics.artistDistribution}
                    labelDistribution={analytics.labelDistribution}
                  />
                </DashboardSection>

                <DashboardSection
                  lede={story.sections.markers.lede}
                  title={story.sections.markers.title}
                >
                  <CollectionMilestones
                    hideHeading={true}
                    onReleaseClick={handleReleaseClick}
                  />
                </DashboardSection>

                <div className={styles.storyPair}>
                  <DashboardSection
                    lede={story.sections.share.lede}
                    title={story.sections.share.title}
                  >
                    <MostCrated
                      hideHeading={true}
                      onReleaseClick={handleReleaseClick}
                    />
                  </DashboardSection>

                  <DashboardSection
                    lede={story.sections.upkeep.lede}
                    title={story.sections.upkeep.title}
                  >
                    <CollectionHealth
                      health={analytics.health}
                      hideHeading={true}
                      onReleaseClick={handleReleaseClick}
                    />
                  </DashboardSection>
                </div>
              </div>
            )}
          </div>
        </PlaybackPageShell>
      </Page>
      <ReleaseModal
        isOpen={selectedRelease !== null}
        release={selectedRelease}
        onClose={handleCloseModal}
        onReleaseClick={handleReleaseClick}
      />
    </>
  );
}

export default function DashboardClient() {
  return <DashboardClientContent />;
}
