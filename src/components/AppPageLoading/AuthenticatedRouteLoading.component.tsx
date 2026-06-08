"use client";

import { usePathname } from "next/navigation";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { StickyHeaderBar } from "src/components/StickyHeaderBar/StickyHeaderBar.component";
import { AppPageLoading } from "./AppPageLoading.component";
import styles from "./AppPageLoading.module.css";
import { getAppPageLoadingConfig } from "./appPageLoading.config";

export const AuthenticatedRouteLoading = () => {
  const pathname = usePathname();
  const config = getAppPageLoadingConfig(pathname);

  if (config) {
    return <AppPageLoading {...config} />;
  }

  if (pathname.startsWith("/admin")) {
    return (
      <>
        <StickyHeaderBar
          allReleasesLoaded={true}
          currentPage="admin"
          hideFilters={true}
        />
        <div className={styles.content}>
          <div className={styles.loaderArea}>
            <PageLoader message="Loading admin dashboard..." size="3xl" />
          </div>
        </div>
      </>
    );
  }

  return null;
};
