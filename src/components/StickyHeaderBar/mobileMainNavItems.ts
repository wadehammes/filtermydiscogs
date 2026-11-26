import type { ComponentType, SVGProps } from "react";
import Crates from "src/styles/icons/crates-thin.svg";
import Dashboard from "src/styles/icons/dashboard.svg";
import Mosaic from "src/styles/icons/mosaic-thin.svg";
import VinylRecord from "src/styles/icons/vinyl-thin.svg";

export type MobileMainNavPage = "dashboard" | "releases" | "crates" | "mosaic";

export type MobileMainNavItem = {
  page: MobileMainNavPage;
  href: string;
  label: string;
  ariaLabel: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export type MobileMainNavVisibility = {
  showDashboard: boolean;
  showReleases: boolean;
  showCrates: boolean;
  showMosaic: boolean;
};

export const MOBILE_MAIN_NAV_ITEMS: readonly MobileMainNavItem[] = [
  {
    page: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    ariaLabel: "View dashboard",
    Icon: Dashboard,
  },
  {
    page: "releases",
    href: "/collection",
    label: "Collection",
    ariaLabel: "View collection",
    Icon: VinylRecord,
  },
  {
    page: "crates",
    href: "/crates",
    label: "Crates",
    ariaLabel: "View crates",
    Icon: Crates,
  },
  {
    page: "mosaic",
    href: "/mosaic",
    label: "Mosaic",
    ariaLabel: "View mosaic",
    Icon: Mosaic,
  },
];

export const MOBILE_MAIN_NAV_VISIBILITY: Record<
  MobileMainNavPage,
  keyof MobileMainNavVisibility
> = {
  dashboard: "showDashboard",
  crates: "showCrates",
  mosaic: "showMosaic",
  releases: "showReleases",
};

export const getVisibleMobileMainNavItems = (
  visibility: MobileMainNavVisibility,
) =>
  MOBILE_MAIN_NAV_ITEMS.filter(
    (item) => visibility[MOBILE_MAIN_NAV_VISIBILITY[item.page]],
  );
