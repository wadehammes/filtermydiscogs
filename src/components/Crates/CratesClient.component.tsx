"use client";

import { useMemo } from "react";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { useCrate } from "src/context/crate.context";
import { useRedirectIfUnauthenticated } from "src/hooks/useRedirectIfUnauthenticated.hook";
import { CrateHubCard } from "./CrateHubCard.component";
import styles from "./CratesClient.module.css";

export default function CratesClient() {
  const { shouldRedirectHome, isCheckingAuth } = useRedirectIfUnauthenticated();
  const { crates, isLoading } = useCrate();

  const sortedCrates = useMemo(
    () =>
      [...crates].sort((left, right) => {
        if (left.is_default !== right.is_default) {
          return left.is_default ? -1 : 1;
        }

        return left.name.localeCompare(right.name);
      }),
    [crates],
  );

  if (shouldRedirectHome || isCheckingAuth) {
    return null;
  }

  return (
    <div className={styles.pageShell} data-testid="fmdCratesClient">
      <StickyHeaderBar
        allReleasesLoaded={true}
        currentPage="crates"
        hideFilters={true}
      />
      <main className={styles.page}>
        <div className={styles.container}>
          <header className={styles.pageHeader}>
            <div className={styles.titleGroup}>
              <h1 className={styles.title}>Crates</h1>
              <p className={styles.subtitle}>
                Open a crate to review releases, edit collection notes, and pack
                for your gig.
              </p>
            </div>
          </header>

          {isLoading ? (
            <div className={styles.loadingState}>
              <PageLoader message="Loading crates..." />
            </div>
          ) : sortedCrates.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No crates yet. Create one to start curating a set.</p>
            </div>
          ) : (
            <div className={styles.crateGrid}>
              {sortedCrates.map((crate) => (
                <CrateHubCard key={crate.id} crate={crate} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
