"use client";

import classNames from "classnames";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { ReleaseSimilarReleaseItem } from "src/components/ReleaseSimilarReleaseItem/ReleaseSimilarReleaseItem.component";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseSimilarSidebar.module.css";

interface ReleaseSimilarSidebarProps {
  similarReleases: DiscogsRelease[];
  isLoading?: boolean;
  onReleaseClick?: (instanceId: string) => void;
  variant?: "aside" | "inline";
}

export const ReleaseSimilarSidebar = ({
  similarReleases,
  isLoading = false,
  onReleaseClick,
  variant = "aside",
}: ReleaseSimilarSidebarProps) => {
  if (!isLoading && similarReleases.length === 0) {
    return null;
  }

  const Root = variant === "inline" ? "section" : "aside";

  return (
    <Root
      className={classNames(
        variant === "inline" ? styles.sidebarInline : styles.sidebarAside,
      )}
      aria-label="Similar in your collection"
      data-testid="fmdReleaseSimilarSidebar"
    >
      <div className={styles.sidebarHeader}>
        <h3 className={styles.sidebarTitle}>Similar in your collection</h3>
        <p className={styles.sidebarSubtitle}>
          Shared genres and styles with this release.
        </p>
      </div>
      {isLoading ? (
        <div
          className={styles.loadingState}
          data-testid="fmdReleaseSimilarSidebarLoading"
        >
          <PageLoader message="Loading similar releases..." />
        </div>
      ) : (
        <div
          className={classNames(
            styles.releasesList,
            variant === "inline"
              ? styles.releasesListInline
              : styles.releasesListAside,
          )}
        >
          {similarReleases.map((similarRelease) => (
            <ReleaseSimilarReleaseItem
              key={similarRelease.instance_id}
              release={similarRelease}
              {...definedProps({ onReleaseClick })}
            />
          ))}
        </div>
      )}
    </Root>
  );
};
