import classNames from "classnames";
import Link from "next/link";
import { trackEvent } from "src/analytics/analytics";
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

export const PageNavigation = ({
  currentPage,
  showMosaic = true,
  showReleases = true,
  showDashboard = true,
  showCrates = true,
  isDisabled = false,
}: PageNavigationProps) => {
  const handleNavigation = (
    e: React.MouseEvent<HTMLAnchorElement>,
    label: string,
  ) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    trackEvent("pageNavigation", {
      action: "pageNavigation",
      category: "navigation",
      label: `Navigate to ${label}`,
      value: label.toLowerCase(),
    });
  };

  return (
    <nav
      className={classNames(styles.navigation, {
        [styles.disabled]: isDisabled,
      })}
    >
      {showDashboard && (
        <Link
          href="/dashboard"
          className={classNames(styles.navItem, {
            [styles.active]: currentPage === "dashboard",
            [styles.disabled]: isDisabled,
          })}
          onClick={(e) => handleNavigation(e, "Dashboard")}
          aria-label="View dashboard"
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <span className={styles.icon}>
            <Dashboard />
          </span>
          <span>Dashboard</span>
        </Link>
      )}

      {showReleases && (
        <Link
          href="/releases"
          className={classNames(styles.navItem, {
            [styles.active]: currentPage === "releases",
            [styles.disabled]: isDisabled,
          })}
          onClick={(e) => handleNavigation(e, "Releases")}
          aria-label="View releases"
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <span className={styles.icon}>
            <VinylRecord />
          </span>
          <span>Releases</span>
        </Link>
      )}

      {showCrates && (
        <Link
          href="/crates"
          className={classNames(styles.navItem, {
            [styles.active]: currentPage === "crates",
            [styles.disabled]: isDisabled,
          })}
          onClick={(e) => handleNavigation(e, "Crates")}
          aria-label="View crates"
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <span className={styles.icon}>
            <Crates />
          </span>
          <span>Crates</span>
        </Link>
      )}

      {showMosaic && (
        <Link
          href="/mosaic"
          className={classNames(styles.navItem, {
            [styles.active]: currentPage === "mosaic",
            [styles.disabled]: isDisabled,
          })}
          onClick={(e) => handleNavigation(e, "Mosaic")}
          aria-label="View mosaic"
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <span className={styles.icon}>
            <Mosaic />
          </span>
          <span>Mosaic</span>
        </Link>
      )}
    </nav>
  );
};
