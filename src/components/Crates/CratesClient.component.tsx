"use client";

import { useMemo } from "react";
import { Page } from "src/components/Page/Page.component";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { CollectionPlaybackPageShell } from "src/components/PlaybackPageShell/CollectionPlaybackPageShell.component";
import {
  ScrollReveal,
  ScrollRevealItem,
} from "src/components/ScrollReveal/ScrollReveal.component";
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
              <ScrollReveal className={styles.crateGrid}>
                {sortedCrates.map((crate, index) => (
                  <ScrollRevealItem index={index} key={crate.id}>
                    <CrateHubCard crate={crate} />
                  </ScrollRevealItem>
                ))}
              </ScrollReveal>
            )}
          </div>
        </main>
      </CollectionPlaybackPageShell>
    </Page>
  );
}
