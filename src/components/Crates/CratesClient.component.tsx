"use client";

import { useMemo } from "react";
import { Page } from "src/components/Page/Page.component";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { CollectionPlaybackPageShell } from "src/components/PlaybackPageShell/CollectionPlaybackPageShell.component";
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
    <Page>
      <CollectionPlaybackPageShell currentPage="crates" hideFilters>
        <main className={styles.page} data-testid="fmdCratesClient">
          <div className={styles.container}>
            <header className={styles.pageHeader}>
              <div className={styles.titleGroup}>
                <h1 className={styles.title}>Crates</h1>
                <p className={styles.subtitle}>
                  Open a crate to review releases, edit collection notes, and
                  pack for your gig.
                </p>
              </div>
              {!isLoading && sortedCrates.length > 0 ? (
                <p className={styles.headerMeta}>
                  {sortedCrates.length} crate
                  {sortedCrates.length === 1 ? "" : "s"}
                </p>
              ) : null}
            </header>

            {isLoading ? (
              <div className={styles.loadingState}>
                <PageLoader message="Loading crates..." />
              </div>
            ) : sortedCrates.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>No crates yet</p>
                <p className={styles.emptyCopy}>
                  Create a crate from the releases page to start curating a set.
                </p>
              </div>
            ) : (
              <div className={styles.crateGrid}>
                {sortedCrates.map((crate) => (
                  <CrateHubCard crate={crate} key={crate.id} />
                ))}
              </div>
            )}
          </div>
        </main>
      </CollectionPlaybackPageShell>
    </Page>
  );
}
