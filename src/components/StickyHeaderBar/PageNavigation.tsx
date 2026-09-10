import classNames from "classnames";
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

  return (
    <nav
      className={classNames(styles.navigation, {
        [styles.disabled]: isDisabled,
      })}
    >
      {showDashboard && (
        <IconButtonLink
          internal
          href="/dashboard"
          className={classNames(styles.navItem, {
            [styles.active]: currentPage === "dashboard",
            [styles.disabled]: isDisabled,
          })}
          iconClassName={styles.icon}
          label="Dashboard"
          onClick={handleNavigation}
          aria-label="View dashboard"
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <Dashboard />
        </IconButtonLink>
      )}

      {showReleases && (
        <IconButtonLink
          internal
          href="/releases"
          className={classNames(styles.navItem, {
            [styles.active]: currentPage === "releases",
            [styles.disabled]: isDisabled,
          })}
          iconClassName={styles.icon}
          label="Releases"
          onClick={handleNavigation}
          aria-label="View releases"
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <VinylRecord />
        </IconButtonLink>
      )}

      {showCrates && (
        <IconButtonLink
          internal
          href="/crates"
          className={classNames(styles.navItem, {
            [styles.active]: currentPage === "crates",
            [styles.disabled]: isDisabled,
          })}
          iconClassName={styles.icon}
          label="Crates"
          onClick={handleNavigation}
          aria-label="View crates"
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <Crates />
        </IconButtonLink>
      )}

      {showMosaic && (
        <IconButtonLink
          internal
          href="/mosaic"
          className={classNames(styles.navItem, {
            [styles.active]: currentPage === "mosaic",
            [styles.disabled]: isDisabled,
          })}
          iconClassName={styles.icon}
          label="Mosaic"
          onClick={handleNavigation}
          aria-label="View mosaic"
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <Mosaic />
        </IconButtonLink>
      )}
    </nav>
  );
};
