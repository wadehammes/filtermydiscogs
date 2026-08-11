"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import styles from "./AppPageLoading.module.css";
import type { AppPage } from "./appPageLoadingMessages";
import { formatLoadingMessage } from "./appPageLoadingMessages";

interface AppPageLoadingProps {
  currentPage: AppPage;
  allReleasesLoaded?: boolean;
  hideFilters?: boolean;
  loadedCount?: number;
  children?: ReactNode;
}

export const AppPageLoading = ({
  currentPage,
  allReleasesLoaded = false,
  hideFilters = false,
  loadedCount,
  children,
}: AppPageLoadingProps) => {
  const message = formatLoadingMessage(currentPage, loadedCount);
  const hasSkeleton = children != null;

  return (
    <>
      <StickyHeaderBar
        allReleasesLoaded={allReleasesLoaded}
        currentPage={currentPage}
        hideFilters={hideFilters}
      />
      <div
        className={classNames(styles.content, {
          [styles.contentWithSkeleton]: hasSkeleton,
        })}
      >
        {hasSkeleton ? (
          children
        ) : (
          <div className={styles.loaderArea}>
            <PageLoader message={message} size="3xl" />
          </div>
        )}
      </div>
    </>
  );
};
