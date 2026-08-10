"use client";

import { useEffect, useMemo } from "react";
import appLoadingStyles from "src/components/AppPageLoading/AppPageLoading.module.css";
import { formatLoadingMessage } from "src/components/AppPageLoading/appPageLoadingMessages";
import { Page } from "src/components/Page/Page.component";
import { ReleaseModal } from "src/components/ReleaseModal/ReleaseModal.component";
import { PlaybackPageShell } from "src/components/ReleasePlayback/PlaybackPageShell.component";
import { Spinner } from "src/components/Spinner/Spinner.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useAuth } from "src/context/auth.context";
import { useRegisterPlaybackReleaseClick } from "src/context/playbackReleaseClick.context";
import { useCollectionValueQuery } from "src/hooks/queries/useCollectionValueQuery";
import { useCollectionAnalytics } from "src/hooks/useCollectionAnalytics.hook";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useNeedsCollectionLoad } from "src/hooks/useNeedsCollectionLoad.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import { buildDashboardStory } from "src/utils/dashboardStory";
import { ArtistLabelCharts } from "./components/ArtistLabelCharts.component";
import { CollectionHealth } from "./components/CollectionHealth.component";
import { CollectionMilestones } from "./components/CollectionMilestones.component";
import { CollectionRhythm } from "./components/CollectionRhythm.component";
import { ComparativeGrowthCharts } from "./components/ComparativeGrowthCharts.component";
import { DashboardHero } from "./components/DashboardHero.component";
import { DashboardSection } from "./components/DashboardSection.component";
import { DashboardSkeleton } from "./components/DashboardSkeleton.component";
import { DistributionCharts } from "./components/DistributionCharts.component";
import { GrowthChart } from "./components/GrowthChart.component";
import { MostCrated } from "./components/MostCrated.component";
import { OnThisDay } from "./components/OnThisDay.component";
import { StyleEvolution } from "./components/StyleEvolution.component";
import styles from "./DashboardClient.module.css";

function DashboardClientContent() {
  const { state: authState } = useAuth();
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const {
    isLoading: collectionLoading,
    hasNextPage,
    isFetchingNextPage,
  } = useCollectionData({
    username: authState.username,
    isAuthenticated: authState.isAuthenticated,
    rateLimited: authState.rateLimited,
    isCheckingAuth: authState.isCheckingAuth,
  });
  const needsCollectionLoad = useNeedsCollectionLoad({
    isLoading: collectionLoading,
    hasNextPage,
    isFetchingNextPage,
  });
  const allReleases = useAllReleases();
  const showLoading = isCheckingAuth || needsCollectionLoad;
  const {
    selectedRelease,
    selectedReleaseId,
    handleReleaseClick,
    handleCloseModal,
  } = useSelectedReleaseModal(allReleases);

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
    if (valueError && process.env.NODE_ENV === "development") {
      console.error("Collection value error:", valueError);
    }
  }, [valueError]);

  if (shouldRedirectHome) {
    return null;
  }

  if (showLoading) {
    const loadingMessage = formatLoadingMessage(
      "dashboard",
      allReleases.length,
    );

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
            <div className={appLoadingStyles.statusBar}>
              <Spinner size="sm" aria-label={loadingMessage} />
              <p className={appLoadingStyles.statusText}>{loadingMessage}</p>
            </div>
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
                    yearInReview={analytics.yearInReview}
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
        isOpen={selectedReleaseId !== null}
        release={selectedRelease}
        onClose={handleCloseModal}
      />
    </>
  );
}

export default function DashboardClient() {
  return <DashboardClientContent />;
}
