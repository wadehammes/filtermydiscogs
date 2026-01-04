import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleNavigation = (page: string, label: string) => {
    if (isDisabled) return;
    trackEvent("pageNavigation", {
      action: "pageNavigation",
      category: "navigation",
      label: `Navigate to ${label}`,
      value: page,
    });
    router.push(`/${page}`);
  };

  return (
    <nav
      className={`${styles.navigation} ${isDisabled ? styles.disabled : ""}`}
    >
      {showReleases && (
        <button
          type="button"
          className={`${styles.navItem} ${currentPage === "releases" ? styles.active : ""}`}
          onClick={() => handleNavigation("releases", "Releases")}
          aria-label="View releases"
          disabled={isDisabled}
        >
          <span className={styles.icon}>
            <VinylRecord />
          </span>
          <span>Releases</span>
        </button>
      )}

      {showMosaic && (
        <button
          type="button"
          className={`${styles.navItem} ${currentPage === "mosaic" ? styles.active : ""}`}
          onClick={() => handleNavigation("mosaic", "Mosaic")}
          aria-label="View mosaic"
          disabled={isDisabled}
        >
          <span className={styles.icon}>
            <Grid />
          </span>
          <span>Mosaic</span>
        </button>
      )}

      <button
        type="button"
        className={`${styles.navItem} ${currentPage === "about" ? styles.active : ""}`}
        onClick={() => handleNavigation("about", "About")}
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
      </button>
    </nav>
  );
};
