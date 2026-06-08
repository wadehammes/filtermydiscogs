"use client";

import type { ReactNode } from "react";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import styles from "./AppPageLoading.module.css";

export type AppPage = "releases" | "dashboard" | "mosaic";

const LOADING_MESSAGES: Record<AppPage, string> = {
  releases: "Loading releases...",
  dashboard: "Loading dashboard...",
  mosaic: "Loading mosaic...",
};

interface AppPageLoadingProps {
  currentPage: AppPage;
  allReleasesLoaded?: boolean;
  hideFilters?: boolean;
  progressText?: ReactNode;
  children?: ReactNode;
}

export const AppPageLoading = ({
  currentPage,
  allReleasesLoaded = false,
  hideFilters = false,
  progressText,
  children,
}: AppPageLoadingProps) => {
  return (
    <>
      <StickyHeaderBar
        allReleasesLoaded={allReleasesLoaded}
        currentPage={currentPage}
        hideFilters={hideFilters}
      />
      <div className={styles.content}>
        <div className={styles.loaderArea}>
          <PageLoader message={LOADING_MESSAGES[currentPage]} size="3xl" />
          {progressText ? (
            <div className={styles.progressText}>{progressText}</div>
          ) : null}
        </div>
        {children}
      </div>
    </>
  );
};
