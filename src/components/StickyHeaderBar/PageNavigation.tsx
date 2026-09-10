import classNames from "classnames";
import type { ComponentType, SVGProps } from "react";
import { IconButtonLink } from "src/components/IconButton/IconButtonLink.component";
import Crates from "src/styles/icons/crates-thin.svg";
import Dashboard from "src/styles/icons/dashboard.svg";
import Mosaic from "src/styles/icons/mosaic.svg";
import VinylRecord from "src/styles/icons/vinyl-record.svg";
import styles from "./PageNavigation.module.css";

interface PageNavigationProps {
  currentPage?: string | undefined;
  showMosaic?: boolean;
  showReleases?: boolean;
  showDashboard?: boolean;
  showCrates?: boolean;
  isDisabled?: boolean;
}

const PAGE_NAV_ITEMS = [
  {
    page: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    ariaLabel: "View dashboard",
    Icon: Dashboard,
  },
  {
    page: "releases",
    href: "/releases",
    label: "Releases",
    ariaLabel: "View releases",
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
] as const satisfies ReadonlyArray<{
  page: string;
  href: string;
  label: string;
  ariaLabel: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}>;

export const PageNavigation = ({
  currentPage,
  showMosaic = true,
  showReleases = true,
  showDashboard = true,
  showCrates = true,
  isDisabled = false,
}: PageNavigationProps) => {
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isDisabled) {
      e.preventDefault();
    }
  };

  const showByPage: Record<(typeof PAGE_NAV_ITEMS)[number]["page"], boolean> = {
    dashboard: showDashboard,
    releases: showReleases,
    crates: showCrates,
    mosaic: showMosaic,
  };

  return (
    <nav
      className={classNames(styles.navigation, {
        [styles.disabled]: isDisabled,
      })}
      aria-label="App"
    >
      {PAGE_NAV_ITEMS.filter(({ page }) => showByPage[page]).map(
        ({ page, href, label, ariaLabel, Icon }) => (
          <IconButtonLink
            key={page}
            internal
            href={href}
            className={classNames(styles.navItem, {
              [styles.active]: currentPage === page,
              [styles.disabled]: isDisabled,
            })}
            iconClassName={styles.icon}
            label={label}
            onClick={handleNavigation}
            aria-label={ariaLabel}
            aria-current={currentPage === page ? "page" : undefined}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : undefined}
          >
            <Icon />
          </IconButtonLink>
        ),
      )}
    </nav>
  );
};
