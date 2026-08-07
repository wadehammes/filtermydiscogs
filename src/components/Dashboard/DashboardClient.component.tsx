"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo } from "react";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import { ReleaseModal } from "src/components/ReleaseModal/ReleaseModal.component";
import { ReleaseMiniPlayer } from "src/components/ReleasePlayback/ReleaseMiniPlayer.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useAuth } from "src/context/auth.context";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import { useCollectionValueQuery } from "src/hooks/queries/useCollectionValueQuery";
import { useCollectionAnalytics } from "src/hooks/useCollectionAnalytics.hook";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useNeedsCollectionLoad } from "src/hooks/useNeedsCollectionLoad.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import { buildDashboardStory } from "src/utils/dashboardStory";
import { definedProps } from "src/utils/definedProps";
import { CollectionHealth } from "./components/CollectionHealth.component";
import { CollectionMilestones } from "./components/CollectionMilestones.component";
import { DashboardHero } from "./components/DashboardHero.component";
import { DashboardSection } from "./components/DashboardSection.component";
import { DashboardSkeleton } from "./components/DashboardSkeleton.component";
import { MostCrated } from "./components/MostCrated.component";
import { OnThisDay } from "./components/OnThisDay.component";
import styles from "./DashboardClient.module.css";

const ArtistLabelCharts = dynamic(
  () =>
    import("./components/ArtistLabelCharts.component").then((m) => ({
      default: m.ArtistLabelCharts,
    })),
  { ssr: false },
);

const DistributionCharts = dynamic(
  () =>
    import("./components/DistributionCharts.component").then((m) => ({
      default: m.DistributionCharts,
    })),
  { ssr: false },
);

const GrowthChart = dynamic(
  () =>
    import("./components/GrowthChart.component").then((m) => ({
      default: m.GrowthChart,
    })),
  { ssr: false },
);

const StyleEvolution = dynamic(
  () =>
    import("./components/StyleEvolution.component").then((m) => ({
      default: m.StyleEvolution,
    })),
  { ssr: false },
);

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
    return (
      <AppPageLoading
        currentPage="dashboard"
        hideFilters={true}
        allReleasesLoaded={false}
        loadedCount={allReleases.length}
      >
        <div className={styles.container}>
          <DashboardSkeleton />
        </div>
      </AppPageLoading>
    );
  }

  return (
    <>
      <StickyHeaderBar
        allReleasesLoaded={true}
        currentPage="dashboard"
        hideFilters={true}
      />
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
              <GrowthChart growthData={analytics.growth} hideHeading={true} />
            </DashboardSection>

            <DashboardSection
              lede={story.sections.sound.lede}
              title={story.sections.sound.title}
            >
              <DistributionCharts
                styleDistribution={analytics.styleDistribution}
                decadeDistribution={analytics.decadeDistribution}
                mediaTypeDistribution={analytics.mediaTypeDistribution}
                formatTagDistribution={analytics.formatTagDistribution}
                mediaFormatSubtypeBreakdown={
                  analytics.mediaFormatSubtypeBreakdown ?? []
                }
              />
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
      <ReleaseModal
        isOpen={selectedReleaseId !== null}
        release={selectedRelease}
        onClose={handleCloseModal}
      />
      <ReleaseMiniPlayer
        {...definedProps({ onReleaseClick: handleReleaseClick })}
      />
    </>
  );
}

export default function DashboardClient() {
  return (
    <ReleasePlaybackProvider>
      <DashboardClientContent />
    </ReleasePlaybackProvider>
  );
}
