import type { AppPage } from "./AppPageLoading.component";

export interface AppPageLoadingConfig {
  currentPage: AppPage;
  hideFilters?: boolean;
}

const APP_ROUTE_LOADING: Record<string, AppPageLoadingConfig> = {
  "/releases": { currentPage: "releases" },
  "/dashboard": { currentPage: "dashboard", hideFilters: true },
  "/mosaic": { currentPage: "mosaic" },
};

export const getAppPageLoadingConfig = (
  pathname: string,
): AppPageLoadingConfig | null => APP_ROUTE_LOADING[pathname] ?? null;

export const isAuthenticatedAppPath = (pathname: string): boolean =>
  pathname.startsWith("/admin") || getAppPageLoadingConfig(pathname) !== null;
