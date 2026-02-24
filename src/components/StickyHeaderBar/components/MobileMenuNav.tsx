import classNames from "classnames";
import Link from "next/link";
import About from "src/styles/icons/about.svg";
import Dashboard from "src/styles/icons/dashboard.svg";
import Mosaic from "src/styles/icons/mosaic.svg";
import VinylRecord from "src/styles/icons/vinyl-record.svg";
import styles from "./MobileMenu.module.css";

interface MobileMenuNavProps {
  currentPage?: string | undefined;
  showMosaic?: boolean;
  showReleases?: boolean;
  showDashboard?: boolean;
  isDisabled?: boolean;
  onNavigation: (e: React.MouseEvent<HTMLAnchorElement>, label: string) => void;
}

export function MobileMenuNav({
  currentPage,
  showMosaic = true,
  showReleases = true,
  showDashboard = true,
  isDisabled = false,
  onNavigation,
}: MobileMenuNavProps) {
  return (
    <nav className={styles.menuNav}>
      {showDashboard && (
        <Link
          href="/dashboard"
          className={classNames(styles.menuItem, {
            [styles.active as string]: currentPage === "dashboard",
            [styles.disabled as string]: isDisabled,
          })}
          onClick={(e) => onNavigation(e, "Dashboard")}
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <span className={styles.menuIcon}>
            <Dashboard />
          </span>
          <span>Dashboard</span>
        </Link>
      )}

      {showReleases && (
        <Link
          href="/releases"
          className={classNames(styles.menuItem, {
            [styles.active as string]: currentPage === "releases",
            [styles.disabled as string]: isDisabled,
          })}
          onClick={(e) => onNavigation(e, "Releases")}
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <span className={styles.menuIcon}>
            <VinylRecord />
          </span>
          <span>Releases</span>
        </Link>
      )}

      {showMosaic && (
        <Link
          href="/mosaic"
          className={classNames(styles.menuItem, {
            [styles.active as string]: currentPage === "mosaic",
            [styles.disabled as string]: isDisabled,
          })}
          onClick={(e) => onNavigation(e, "Mosaic")}
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <span className={styles.menuIcon}>
            <Mosaic />
          </span>
          <span>Mosaic</span>
        </Link>
      )}

      <Link
        href="/about"
        className={classNames(styles.menuItem, {
          [styles.active as string]: currentPage === "about",
        })}
        onClick={(e) => onNavigation(e, "About")}
      >
        <span className={styles.menuIcon}>
          <About />
        </span>
        <span>About</span>
      </Link>
    </nav>
  );
}
