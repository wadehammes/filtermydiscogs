"use client";

import { useEffect } from "react";
import AuthLoading from "src/components/AuthLoading/AuthLoading.component";
import Login from "src/components/Login/Login.component";
import Spinner from "src/components/Spinner/Spinner.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useAuth } from "src/context/auth.context";
import { useCollectionValueQuery } from "src/hooks/queries/useCollectionValueQuery";
import { useCollectionAnalytics } from "src/hooks/useCollectionAnalytics.hook";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import { ArtistLabelCharts } from "./components/ArtistLabelCharts.component";
import { CollectionHealth } from "./components/CollectionHealth.component";
import { CollectionMilestones } from "./components/CollectionMilestones.component";
import { DistributionCharts } from "./components/DistributionCharts.component";
import { GrowthChart } from "./components/GrowthChart.component";
import { MostCrated } from "./components/MostCrated.component";
import { OnThisDay } from "./components/OnThisDay.component";
import { StatsCards } from "./components/StatsCards.component";
import { StyleEvolution } from "./components/StyleEvolution.component";
import styles from "./DashboardClient.module.css";

export default function DashboardClient() {
  const { state: authState } = useAuth();
  const { isLoading: collectionLoading } = useCollectionData(
    authState.username,
    authState.isAuthenticated,
  );

  const analytics = useCollectionAnalytics();
  const {
    data: collectionValue,
    isLoading: valueLoading,
    error: valueError,
  } = useCollectionValueQuery(authState.username);

  useEffect(() => {
    if (valueError && process.env.NODE_ENV === "development") {
      console.error("Collection value error:", valueError);
    }
  }, [valueError]);

  if (!authState.isAuthenticated && authState.isLoading) {
    return <AuthLoading />;
  }

  if (!authState.isAuthenticated) {
    return <Login />;
  }

  if (collectionLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="3xl" aria-label="Loading your collection" />
        <p>Loading your collection...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <>
        <StickyHeaderBar
          allReleasesLoaded={true}
          currentPage="dashboard"
          hideFilters={true}
        />
        <div className={styles.emptyState}>
          <h1>No collection data</h1>
          <p>Your collection appears to be empty.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <StickyHeaderBar
        allReleasesLoaded={true}
        currentPage="dashboard"
        hideFilters={true}
      />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Collection Dashboard</h1>
          <p className={styles.subtitle}>
            Insights and analytics about your Discogs collection
          </p>
        </div>

        <div className={styles.content}>
          <StatsCards
            stats={analytics.stats}
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
              formatDistribution={analytics.formatDistribution}
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
      </div>
    </>
  );
}
