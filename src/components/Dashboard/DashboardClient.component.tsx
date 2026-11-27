"use client";

import { useEffect, useMemo } from "react";
import { EmptyState } from "src/components/EmptyState/EmptyState.component";
import { Page } from "src/components/Page/Page.component";
import { CollectionPlaybackPageShell } from "src/components/PlaybackPageShell/CollectionPlaybackPageShell.component";
import { ReleaseModalLazyOverlay } from "src/components/ReleaseModal/ReleaseModalLazyOverlay.component";
import { DASHBOARD_PAGE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { useRegisterPlaybackReleaseClick } from "src/context/playbackReleaseClick.context";
import { useCollectionValueQuery } from "src/hooks/queries/useCollectionValueQuery";
import { useCollectionAnalytics } from "src/hooks/useCollectionAnalytics.hook";
import { useCollectionLoadState } from "src/hooks/useCollectionData.hook";
import { useDashboardCollectionDrilldown } from "src/hooks/useDashboardCollectionDrilldown.hook";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useNeedsCollectionLoad } from "src/hooks/useNeedsCollectionLoad.hook";
import { usePaintDeferredMount } from "src/hooks/usePaintDeferredMount.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { useLocalSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import { getErrorHttpStatus } from "src/lib/sentry/getErrorHttpStatus";
import { reportClientFailure } from "src/lib/sentry/reportClientFailure";
import { shouldReportHttpFailure } from "src/lib/sentry/shouldReportHttpFailure";
import { buildDashboardStory } from "src/utils/dashboardStory";
import { isLocalDevHost } from "src/utils/isLocalDevHost";
import { CollectionHealth } from "./CollectionHealth.component";
import { CollectionMilestones } from "./CollectionMilestones.component";
import { CollectionRhythm } from "./CollectionRhythm.component";
import { DashboardArtistLabelChartsLazy } from "./DashboardArtistLabelChartsLazy.component";
import styles from "./DashboardClient.module.css";
import { DashboardComparativeGrowthChartsLazy } from "./DashboardComparativeGrowthChartsLazy.component";
import { DashboardDistributionChartsLazy } from "./DashboardDistributionChartsLazy.component";
import { DashboardGrowthChartLazy } from "./DashboardGrowthChartLazy.component";
import { DashboardHero } from "./DashboardHero.component";
import { DashboardSection } from "./DashboardSection.component";
import { DashboardSkeleton } from "./DashboardSkeleton.component";
import { MostCrated } from "./MostCrated.component";
import { OnThisDay } from "./OnThisDay.component";
import { StyleEvolution } from "./StyleEvolution.component";
import { TopTracks } from "./TopTracks.component";
import { WeeklyRecap } from "./WeeklyRecap.component";

function DashboardClientContent() {
  const { state: authState } = useAuth();
  const {
    state: { fetchingCollection },
  } = useCollectionContext();
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
  const shelfHydrated = allReleases.length > 0;
  const awaitingCollectionContext = fetchingCollection && !shelfHydrated;
  const showLoading =
    isCheckingAuth || needsCollectionLoad || awaitingCollectionContext;
  const { selectedRelease, handleReleaseClick, handleCloseModal } =
    useLocalSelectedReleaseModal({
      collectionUsername: authState.username,
      fallbackReleases: allReleases,
    });

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
    if (!valueError) {
      return;
    }

    const httpStatus = getErrorHttpStatus(valueError);
    if (httpStatus !== undefined && shouldReportHttpFailure(httpStatus)) {
      return;
    }

    if (isLocalDevHost()) {
      console.error("Collection value error:", valueError);
    }

    reportClientFailure("dashboard", valueError, {
      segment: "collection_value",
    });
  }, [valueError]);

  const dashboardContentReady =
    !showLoading && analytics !== null && story !== null;
  const mountBelowFold = usePaintDeferredMount(dashboardContentReady, {
    immediate: shelfHydrated,
  });
  const openCollectionDrilldown = useDashboardCollectionDrilldown();

  if (shouldRedirectHome) {
    return null;
  }

  return (
    <Page>
      <CollectionPlaybackPageShell
        allReleasesLoaded={true}
        currentPage="dashboard"
        hideFilters
        overlays={
          <ReleaseModalLazyOverlay
            release={selectedRelease}
            onClose={handleCloseModal}
            onReleaseClick={handleReleaseClick}
          />
        }
      >
        <main
          className={styles.container}
          aria-label={showLoading ? undefined : DASHBOARD_PAGE_MAIN_LABEL}
          data-testid={showLoading ? undefined : "fmdDashboardClient"}
        >
          {showLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {!fetchingCollection &&
                allReleases.length === 0 &&
                !analytics && (
                  <EmptyState
                    variant="page"
                    title="Nothing on the shelf yet"
                    description="Add records to your Discogs collection to see them here."
                  />
                )}

              {dashboardContentReady && story && analytics && (
                <div className={styles.content}>
                  <DashboardHero
                    story={story}
                    stats={analytics.stats}
                    collectionValue={collectionValue}
                    isLoadingValue={valueLoading}
                    valueError={valueError}
                  />

                  <div className={styles.storyPair}>
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
                      lede={story.sections.weeklyRecap.lede}
                      title={story.sections.weeklyRecap.title}
                    >
                      <WeeklyRecap
                        hideHeading={true}
                        onReleaseClick={handleReleaseClick}
                      />
                    </DashboardSection>
                  </div>

                  <div className={styles.belowFold} aria-busy={!mountBelowFold}>
                    {mountBelowFold && (
                      <>
                        <DashboardSection
                          lede={story.sections.growth.lede}
                          title={story.sections.growth.title}
                        >
                          <CollectionRhythm
                            acquisitionStreaks={analytics.acquisitionStreaks}
                          />
                          <DashboardGrowthChartLazy
                            growthData={analytics.growth}
                            hideHeading={true}
                          />
                        </DashboardSection>

                        <DashboardSection
                          lede={story.sections.sound.lede}
                          title={story.sections.sound.title}
                        >
                          <DashboardDistributionChartsLazy
                            styleDistribution={analytics.styleDistribution}
                            genreDistribution={analytics.genreDistribution}
                            decadeDistribution={analytics.decadeDistribution}
                            mediaTypeDistribution={
                              analytics.mediaTypeDistribution
                            }
                            formatTagDistribution={
                              analytics.formatTagDistribution
                            }
                            onDrilldown={openCollectionDrilldown}
                          />
                          <DashboardComparativeGrowthChartsLazy
                            hideHeading={true}
                          />
                          <StyleEvolution
                            hideHeading={true}
                            sectionCopy={story.sections.styleEvolution}
                          />
                        </DashboardSection>

                        <DashboardSection
                          lede={story.sections.playback.lede}
                          title={story.sections.playback.title}
                        >
                          <TopTracks onReleaseClick={handleReleaseClick} />
                        </DashboardSection>

                        <DashboardSection
                          lede={story.sections.names.lede}
                          title={story.sections.names.title}
                        >
                          <DashboardArtistLabelChartsLazy
                            artistDistribution={analytics.artistDistribution}
                            labelDistribution={analytics.labelDistribution}
                            onDrilldown={openCollectionDrilldown}
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
                              onDrilldown={openCollectionDrilldown}
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
                              onDrilldown={openCollectionDrilldown}
                            />
                          </DashboardSection>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </CollectionPlaybackPageShell>
    </Page>
  );
}

export default function DashboardClient() {
  return <DashboardClientContent />;
}
