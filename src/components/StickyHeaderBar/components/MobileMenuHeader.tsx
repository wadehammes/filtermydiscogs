import classNames from "classnames";
import DiceSolid from "src/styles/icons/dice-solid.svg";
import FilterSolid from "src/styles/icons/filter-solid.svg";
import MenuIcon from "src/styles/icons/menu.svg";
import XIcon from "src/styles/icons/x.svg";
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
              <DiceSolid />
            </span>
          </button>
          <button
            type="button"
            className={styles.filtersButton}
            onClick={onFiltersClick}
            aria-label="Open filters"
          >
            <span className={styles.filterIcon}>
              <FilterSolid />
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
