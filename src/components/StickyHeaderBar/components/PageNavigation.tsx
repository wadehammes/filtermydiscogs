import { useRouter } from "next/navigation";
import { trackEvent } from "src/analytics/analytics";
import styles from "./PageNavigation.module.css";

interface PageNavigationProps {
  currentPage?: string | undefined;
  showMosaic?: boolean;
  showReleases?: boolean;
}

export const PageNavigation = ({
  currentPage,
  showMosaic = true,
  showReleases = true,
}: PageNavigationProps) => {
  const router = useRouter();

  const handleNavigation = (page: string, label: string) => {
    trackEvent("pageNavigation", {
      action: "pageNavigation",
      category: "navigation",
      label: `Navigate to ${label}`,
      value: page,
    });
    router.push(`/${page}`);
  };

  return (
    <nav className={styles.navigation}>
      {showReleases && (
        <button
          type="button"
          className={`${styles.navItem} ${currentPage === "releases" ? styles.active : ""}`}
          onClick={() => handleNavigation("releases", "Releases")}
          aria-label="View releases"
        >
          <span className={styles.icon}>📀</span>
          <span>Releases</span>
        </button>
      )}

      {showMosaic && (
        <button
          type="button"
          className={`${styles.navItem} ${currentPage === "mosaic" ? styles.active : ""}`}
          onClick={() => handleNavigation("mosaic", "Mosaic")}
          aria-label="View mosaic"
        >
          <span className={styles.icon}>🖼️</span>
          <span>Mosaic</span>
        </button>
      )}
    </nav>
  );
};
