import classNames from "classnames";
import Link from "next/link";
import Crates from "src/styles/icons/crates-thin.svg";
import Dashboard from "src/styles/icons/dashboard.svg";
import Mosaic from "src/styles/icons/mosaic.svg";
import VinylRecord from "src/styles/icons/vinyl-record.svg";
import styles from "./MobileMenu.module.css";

interface MobileMenuNavProps {
  currentPage?: string | undefined;
  showMosaic?: boolean;
  showReleases?: boolean;
  showDashboard?: boolean;
  showCrates?: boolean;
  isDisabled?: boolean;
  onNavigation: (e: React.MouseEvent<HTMLAnchorElement>, label: string) => void;
}

export function MobileMenuNav({
  currentPage,
  showMosaic = true,
  showReleases = true,
  showDashboard = true,
  showCrates = true,
  isDisabled = false,
  onNavigation,
}: MobileMenuNavProps) {
  return (
    <nav className={styles.menuNav}>
      {showDashboard && (
        <Link
          href="/dashboard"
          className={classNames(styles.menuItem, {
            [styles.active]: currentPage === "dashboard",
            [styles.disabled]: isDisabled,
          })}
          onClick={(e) => onNavigation(e, "Dashboard")}
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <span className={styles.menuItemIcon}>
            <Dashboard />
          </span>
          <span>Dashboard</span>
        </Link>
      )}

      {showReleases && (
        <Link
          href="/releases"
          className={classNames(styles.menuItem, {
            [styles.active]: currentPage === "releases",
            [styles.disabled]: isDisabled,
          })}
          onClick={(e) => onNavigation(e, "Releases")}
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <span className={styles.menuItemIcon}>
            <VinylRecord />
          </span>
          <span>Releases</span>
        </Link>
      )}

      {showCrates && (
        <Link
          href="/crates"
          className={classNames(styles.menuItem, {
            [styles.active]: currentPage === "crates",
            [styles.disabled]: isDisabled,
          })}
          onClick={(e) => onNavigation(e, "Crates")}
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <span className={styles.menuItemIcon}>
            <Crates />
          </span>
          <span>Crates</span>
        </Link>
      )}

      {showMosaic && (
        <Link
          href="/mosaic"
          className={classNames(styles.menuItem, {
            [styles.active]: currentPage === "mosaic",
            [styles.disabled]: isDisabled,
          })}
          onClick={(e) => onNavigation(e, "Mosaic")}
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <span className={styles.menuItemIcon}>
            <Mosaic />
          </span>
          <span>Mosaic</span>
        </Link>
      )}
    </nav>
  );
}
