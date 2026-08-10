import classNames from "classnames";
import DiceIcon from "src/styles/icons/dice-thin.svg";
import FilterIcon from "src/styles/icons/filter-thin.svg";
import MenuIcon from "src/styles/icons/menu-thin.svg";
import XIcon from "src/styles/icons/x-thin.svg";
import styles from "./MobileMenu.module.css";

interface MobileMenuHeaderProps {
  isOpen: boolean;
  isRandomMode: boolean;
  shouldShowFilters: boolean;
  appliedFilterCount: number;
  onToggleMenu: () => void;
  onFiltersClick: () => void;
  onRandomModeToggle: () => void;
}

export function MobileMenuHeader({
  isOpen,
  isRandomMode,
  shouldShowFilters,
  appliedFilterCount,
  onToggleMenu,
  onFiltersClick,
  onRandomModeToggle,
}: MobileMenuHeaderProps) {
  const filterButtonLabel =
    appliedFilterCount > 0
      ? `Open filters (${appliedFilterCount} applied)`
      : "Open filters";

  return (
    <div className={styles.mobileNav}>
      {shouldShowFilters && (
        <>
          <button
            type="button"
            className={classNames(styles.filtersButton, {
              [styles.active]: isRandomMode,
            })}
            onClick={onRandomModeToggle}
            aria-label={
              isRandomMode ? "Exit random mode" : "Show a random release"
            }
          >
            <span className={styles.filterIcon}>
              <DiceIcon />
            </span>
          </button>
          <button
            type="button"
            className={classNames(styles.filtersButton, {
              [styles.active]: appliedFilterCount > 0,
            })}
            onClick={onFiltersClick}
            aria-label={filterButtonLabel}
          >
            <span className={styles.filterIcon}>
              <FilterIcon
                className={classNames({
                  [styles.filterIconActive]: appliedFilterCount > 0,
                })}
              />
              {appliedFilterCount > 0 ? (
                <span className={styles.filterBadge} aria-hidden="true">
                  {appliedFilterCount}
                </span>
              ) : null}
            </span>
          </button>
        </>
      )}

      <button
        type="button"
        className={styles.hamburger}
        onClick={onToggleMenu}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <XIcon className={styles.menuIcon} />
        ) : (
          <MenuIcon className={styles.menuIcon} />
        )}
      </button>
    </div>
  );
}
