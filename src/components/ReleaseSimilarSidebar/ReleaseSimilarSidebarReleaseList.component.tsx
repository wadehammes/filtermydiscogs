"use client";

import classNames from "classnames";
import type { RefObject } from "react";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { ReleaseSimilarReleaseItem } from "src/components/ReleaseSimilarReleaseItem/ReleaseSimilarReleaseItem.component";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseSimilarSidebar.module.css";

type ReleaseSimilarSidebarReleaseListProps = {
  variant: "aside" | "inline";
  showListLoader: boolean;
  similarReleases: DiscogsRelease[];
  listRef: RefObject<HTMLDivElement | null>;
  onReleaseClick?: (instanceId: string) => void;
};

export const ReleaseSimilarSidebarReleaseList = ({
  variant,
  showListLoader,
  similarReleases,
  listRef,
  onReleaseClick,
}: ReleaseSimilarSidebarReleaseListProps) => {
  if (showListLoader) {
    return (
      <div
        className={styles.loadingState}
        data-testid="fmdReleaseSimilarSidebarLoading"
      >
        <PageLoader message="Loading similar releases..." />
      </div>
    );
  }

  return (
    <div
      ref={listRef}
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
  );
};
