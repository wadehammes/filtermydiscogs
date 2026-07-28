"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useAuth } from "src/context/auth.context";
import { useCollectionValueQuery } from "src/hooks/queries/useCollectionValueQuery";
import { useCollectionAnalytics } from "src/hooks/useCollectionAnalytics.hook";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import { useNeedsCollectionLoad } from "src/hooks/useNeedsCollectionLoad.hook";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { CollectionHealth } from "./components/CollectionHealth.component";
import { CollectionMilestones } from "./components/CollectionMilestones.component";
import { DashboardSkeleton } from "./components/DashboardSkeleton.component";
import { MostCrated } from "./components/MostCrated.component";
import { OnThisDay } from "./components/OnThisDay.component";
import { StatsCards } from "./components/StatsCards.component";
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

export default function DashboardClient() {
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
  const showLoading = isCheckingAuth || needsCollectionLoad;

  const analytics = useCollectionAnalytics();
  const {
    data: collectionValue,
    isLoading: valueLoading,
    error: valueError,
  } = useCollectionValueQuery({ username: authState.username });

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
      <AppPageLoading currentPage="dashboard" hideFilters={true}>
        <DashboardSkeleton />
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
        <div className={styles.header}>
          <h1>Collection Dashboard</h1>
          <p className={styles.subtitle}>
            Insights and analytics about your Discogs collection
          </p>
        </div>

        {!(collectionLoading || analytics) && (
          <div className={styles.emptyState}>
            <h1>No collection data</h1>
            <p>Your collection appears to be empty.</p>
          </div>
        )}

        {!collectionLoading && analytics && (
          <div className={styles.content}>
            <StatsCards
              stats={analytics.stats}
              formatMix={analytics.formatMix}
              collectionValue={collectionValue}
              isLoadingValue={valueLoading}
              valueError={valueError}
            />

            <div className={styles.chartsSection}>
              <GrowthChart growthData={analytics.growth} />
            </div>

            <div className={styles.chartsSection}>
              <DistributionCharts
                styleDistribution={analytics.styleDistribution}
                decadeDistribution={analytics.decadeDistribution}
                mediaTypeDistribution={analytics.mediaTypeDistribution}
                formatTagDistribution={analytics.formatTagDistribution}
                mediaFormatSubtypeBreakdown={
                  analytics.mediaFormatSubtypeBreakdown ?? []
                }
              />
            </div>

            <div className={styles.chartsSection}>
              <ArtistLabelCharts
                artistDistribution={analytics.artistDistribution}
                labelDistribution={analytics.labelDistribution}
              />
            </div>

            <div className={styles.sideBySideSection}>
              <div className={styles.chartsSection}>
                <CollectionMilestones />
              </div>
              <div className={styles.chartsSection}>
                <StyleEvolution />
              </div>
            </div>

            <div className={styles.sideBySideSection}>
              <div className={styles.chartsSection}>
                <OnThisDay />
              </div>
              <div className={styles.chartsSection}>
                <MostCrated />
              </div>
            </div>

            <div className={styles.healthSection}>
              <CollectionHealth health={analytics.health} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
