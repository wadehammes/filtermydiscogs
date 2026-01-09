import Link from "next/link";
import { trackEvent } from "src/analytics/analytics";
import Grid from "src/styles/icons/grid.svg";
import VinylRecord from "src/styles/icons/vinyl-record.svg";
import styles from "./PageNavigation.module.css";

interface PageNavigationProps {
  currentPage?: string | undefined;
  showMosaic?: boolean;
  showReleases?: boolean;
  isDisabled?: boolean;
}

export const PageNavigation = ({
  currentPage,
  showMosaic = true,
  showReleases = true,
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
      className={`${styles.navigation} ${isDisabled ? styles.disabled : ""}`}
    >
      {showReleases && (
        <Link
          href="/releases"
          className={`${styles.navItem} ${currentPage === "releases" ? styles.active : ""} ${isDisabled ? styles.disabled : ""}`}
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
          className={`${styles.navItem} ${currentPage === "mosaic" ? styles.active : ""} ${isDisabled ? styles.disabled : ""}`}
          onClick={(e) => handleNavigation(e, "Mosaic")}
          aria-label="View mosaic"
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <span className={styles.icon}>
            <Grid />
          </span>
          <span>Mosaic</span>
        </Link>
      )}

      <Link
        href="/about"
        className={`${styles.navItem} ${currentPage === "about" ? styles.active : ""}`}
        onClick={(e) => handleNavigation(e, "About")}
        aria-label="View about"
      >
        <span className={styles.icon}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="8"
              cy="8"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 6V8M8 10H8.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span>About</span>
      </Link>
    </nav>
  );
};
