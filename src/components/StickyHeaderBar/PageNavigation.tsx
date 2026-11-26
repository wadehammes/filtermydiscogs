import classNames from "classnames";
import { IconButtonLink } from "src/components/IconButton/IconButtonLink.component";
import {
  getVisibleMobileMainNavItems,
  type MobileMainNavVisibility,
} from "src/components/StickyHeaderBar/mobileMainNavItems";
import styles from "./PageNavigation.module.css";

interface PageNavigationProps extends MobileMainNavVisibility {
  currentPage?: string | undefined;
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

  const items = getVisibleMobileMainNavItems({
    showDashboard,
    showReleases,
    showCrates,
    showMosaic,
  });

  return (
    <nav
      className={classNames(styles.navigation, {
        [styles.disabled]: isDisabled,
      })}
      aria-label="App"
    >
      {items.map(({ page, href, label, ariaLabel, Icon }) => (
        <IconButtonLink
          key={page}
          internal
          href={href}
          className={classNames(styles.navItem, {
            [styles.active]: currentPage === page,
            [styles.disabled]: isDisabled,
          })}
          iconClassName={styles.icon}
          label={label}
          onClick={handleNavigation}
          aria-label={ariaLabel}
          aria-current={currentPage === page ? "page" : undefined}
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
        >
          <Icon />
        </IconButtonLink>
      ))}
    </nav>
  );
};
