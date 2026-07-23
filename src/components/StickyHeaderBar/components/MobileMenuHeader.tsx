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
  onToggleMenu: () => void;
  onFiltersClick: () => void;
  onRandomModeToggle: () => void;
}

export function MobileMenuHeader({
  isOpen,
  isRandomMode,
  shouldShowFilters,
  onToggleMenu,
  onFiltersClick,
  onRandomModeToggle,
}: MobileMenuHeaderProps) {
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
            className={styles.filtersButton}
            onClick={onFiltersClick}
            aria-label="Open filters"
          >
            <span className={styles.filterIcon}>
              <FilterIcon />
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
