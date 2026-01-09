import classNames from "classnames";
import Link from "next/link";
import { trackEvent } from "src/analytics/analytics";
import About from "src/styles/icons/about.svg";
import Dashboard from "src/styles/icons/dashboard.svg";
import Mosaic from "src/styles/icons/mosaic.svg";
import VinylRecord from "src/styles/icons/vinyl-record.svg";
import styles from "./PageNavigation.module.css";

interface PageNavigationProps {
  currentPage?: string | undefined;
  showMosaic?: boolean;
  showReleases?: boolean;
  showDashboard?: boolean;
  isDisabled?: boolean;
}

export const PageNavigation = ({
  currentPage,
  showMosaic = true,
  showReleases = true,
  showDashboard = true,
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
        [styles.disabled as string]: isDisabled,
      })}
    >
      {showDashboard && (
        <Link
          href="/dashboard"
          className={classNames(styles.navItem, {
            [styles.active as string]: currentPage === "dashboard",
            [styles.disabled as string]: isDisabled,
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
            [styles.active as string]: currentPage === "releases",
            [styles.disabled as string]: isDisabled,
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

      {showMosaic && (
        <Link
          href="/mosaic"
          className={classNames(styles.navItem, {
            [styles.active as string]: currentPage === "mosaic",
            [styles.disabled as string]: isDisabled,
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

      <Link
        href="/about"
        className={classNames(styles.navItem, {
          [styles.active as string]: currentPage === "about",
        })}
        onClick={(e) => handleNavigation(e, "About")}
        aria-label="View about"
      >
        <span className={styles.icon}>
          <About />
        </span>
        <span>About</span>
      </Link>
    </nav>
  );
};
