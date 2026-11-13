import classNames from "classnames";
import { CollectionSortControlsJoin } from "src/components/CollectionSortControls/CollectionSortControls.component";
import collectionSortStyles from "src/components/CollectionSortControls/CollectionSortControls.module.css";
import BookmarkIcon from "src/styles/icons/bookmark-thin.svg";
import ChevronIcon from "src/styles/icons/chevron-right-thin.svg";
import SearchIcon from "src/styles/icons/search-thin.svg";
import skeletonPulseStyles from "src/styles/modules/skeleton-pulse.module.css";
import filtersBarStyles from "./FiltersBar.module.css";
import styles from "./FiltersBarSkeleton.module.css";

const pulseSurface = skeletonPulseStyles.pulsesurface;

export const FiltersBarSkeleton = () => {
  return (
    <div
      className={filtersBarStyles.filtersBar}
      data-testid="fmdFiltersBarSkeleton"
    >
      <div className={filtersBarStyles.desktopFiltersStack}>
        <div className={filtersBarStyles.desktopFilters}>
          <div
            className={styles.viewsShell}
            data-testid="fmdFilterViewsMenu"
            aria-hidden
          >
            <span
              className={classNames(
                styles.viewsIcon,
                skeletonPulseStyles.pulse,
              )}
            >
              <BookmarkIcon />
            </span>
            <div className={classNames(styles.viewsLine, pulseSurface)} />
            <span className={styles.chevron}>
              <ChevronIcon />
            </span>
          </div>
          <div className={styles.searchShell} aria-hidden>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <div
              className={classNames(styles.placeholderLineWide, pulseSurface)}
            />
          </div>
          <div className={filtersBarStyles.styleFilterGroup}>
            <div data-testid="fmdAutocompleteSelect" aria-hidden>
              <div
                className={styles.styleFilterPrimaryShell}
                data-filter-control-trigger
                aria-hidden
              >
                <div
                  className={classNames(
                    styles.placeholderLineWide,
                    pulseSurface,
                  )}
                />
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
                <div
                  className={classNames(styles.placeholderLine, pulseSurface)}
                />
                <span className={styles.chevron}>
                  <ChevronIcon />
                </span>
              </div>
            </div>
          </div>
          <div className={filtersBarStyles.styleFilterGroup}>
            <div data-testid="fmdAutocompleteSelect" aria-hidden>
              <div
                className={styles.styleFilterPrimaryShell}
                data-filter-control-trigger
                aria-hidden
              >
                <div
                  className={classNames(
                    styles.placeholderLineWide,
                    pulseSurface,
                  )}
                />
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
                <div
                  className={classNames(styles.placeholderLine, pulseSurface)}
                />
                <span className={styles.chevron}>
                  <ChevronIcon />
                </span>
              </div>
            </div>
          </div>
          <div className={filtersBarStyles.styleFilterGroup}>
            <div data-testid="fmdAutocompleteSelect" aria-hidden>
              <div
                className={styles.styleFilterPrimaryShell}
                data-filter-control-trigger
                aria-hidden
              >
                <div
                  className={classNames(
                    styles.placeholderLineWide,
                    pulseSurface,
                  )}
                />
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
                <div
                  className={classNames(styles.placeholderLine, pulseSurface)}
                />
                <span className={styles.chevron}>
                  <ChevronIcon />
                </span>
              </div>
            </div>
          </div>
          <div
            className={collectionSortStyles.sortFilterGroup}
            data-testid="fmdCollectionSortControls"
            aria-hidden
          >
            <div data-testid="fmdSelect" aria-hidden>
              <div
                className={styles.styleFilterPrimaryShell}
                data-filter-control-trigger
                aria-hidden
              >
                <div
                  className={classNames(
                    styles.placeholderLineWide,
                    pulseSurface,
                  )}
                />
                <span className={styles.chevron}>
                  <ChevronIcon />
                </span>
              </div>
            </div>
            <CollectionSortControlsJoin />
            <div data-testid="fmdSelect" aria-hidden>
              <div
                className={styles.styleFilterPrimaryShell}
                data-filter-control-trigger
                aria-hidden
              >
                <div
                  className={classNames(
                    styles.placeholderLineWide,
                    pulseSurface,
                  )}
                />
                <span className={styles.chevron}>
                  <ChevronIcon />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
