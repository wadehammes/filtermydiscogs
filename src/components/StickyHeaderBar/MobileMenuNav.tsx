import { MobileMenuNavLink } from "src/components/StickyHeaderBar/MobileMenuNavLink.component";
import {
  getVisibleMobileMainNavItems,
  type MobileMainNavVisibility,
} from "src/components/StickyHeaderBar/mobileMainNavItems";
import styles from "./MobileMenu.module.css";

interface MobileMenuNavProps extends MobileMainNavVisibility {
  currentPage?: string | undefined;
  isDisabled?: boolean;
  onNavigation: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const MobileMenuNav = ({
  currentPage,
  showMosaic = true,
  showReleases = true,
  showDashboard = true,
  showCrates = true,
  isDisabled = false,
  onNavigation,
}: MobileMenuNavProps) => {
  const items = getVisibleMobileMainNavItems({
    showDashboard,
    showReleases,
    showCrates,
    showMosaic,
  });

  return (
    <nav className={styles.menuNav} aria-label="Main">
      {items.map((item) => (
        <MobileMenuNavLink
          key={item.page}
          href={item.href}
          active={currentPage === item.page}
          disabled={isDisabled}
          icon={item.Icon}
          onClick={onNavigation}
        >
          {item.label}
        </MobileMenuNavLink>
      ))}
    </nav>
  );
};
