import ChevronIcon from "src/styles/icons/chevron-right-thin.svg";
import SearchIcon from "src/styles/icons/search-thin.svg";
import filtersBarStyles from "./FiltersBar.module.css";
import styles from "./FiltersBarSkeleton.module.css";

export function FiltersBarSkeleton() {
  return (
    <div
      className={filtersBarStyles.filtersBar}
      data-testid="fmdFiltersBarSkeleton"
    >
      <div className={filtersBarStyles.desktopFilters}>
        <div className={styles.searchShell} aria-hidden>
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>
          <div className={styles.placeholderLineWide} />
        </div>
        <div className={filtersBarStyles.styleFilterGroup}>
          <div data-testid="fmdAutocompleteSelect" aria-hidden>
            <div
              className={styles.styleFilterPrimaryShell}
              data-filter-control-trigger
              aria-hidden
            >
              <div className={styles.placeholderLineWide} />
              <span className={styles.chevron}>
                <ChevronIcon />
              </span>
            </div>
          </div>
          <div data-testid="fmdSelect" aria-hidden>
            <div
              className={styles.operatorShell}
              data-filter-control-trigger
              aria-hidden
            >
              <div className={styles.placeholderLine} />
              <span className={styles.chevron}>
                <ChevronIcon />
              </span>
            </div>
          </div>
        </div>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className={styles.selectShell} aria-hidden>
            <div className={styles.placeholderLine} />
            <span className={styles.chevron}>
              <ChevronIcon />
            </span>
          </div>
        ))}
        <div className={styles.buttonShell} aria-hidden>
          <div className={styles.buttonLine} />
        </div>
      </div>
    </div>
  );
}
