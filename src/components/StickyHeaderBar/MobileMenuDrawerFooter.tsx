import classNames from "classnames";
import Link from "next/link";
import { SupportProjectNavLink } from "src/components/SupportProjectNavLink/SupportProjectNavLink.component";
import { SUPPORT_PROJECT_NAV_LABEL } from "src/constants/supportProjectToast.constants";
import { HeartThinIcon } from "src/styles/icons/HeartThinIcon.component";
import styles from "./MobileMenu.module.css";

interface MobileMenuDrawerFooterProps {
  username: string | null;
  onLogout: () => void;
  onAboutClick: () => void;
  onSupportClick: () => void;
  onSettingsClick: () => void;
}

export function MobileMenuDrawerFooter({
  username,
  onLogout,
  onAboutClick,
  onSupportClick,
  onSettingsClick,
}: MobileMenuDrawerFooterProps) {
  return (
    <section className={styles.menuAccountSection} aria-label="Account">
      {username ? <p className={styles.menuAccountLabel}>{username}</p> : null}
      <nav className={styles.menuSecondaryNav} aria-label="Account links">
        <Link
          href="/settings"
          className={styles.menuItem}
          onClick={onSettingsClick}
        >
          Settings
        </Link>
        <Link href="/about" className={styles.menuItem} onClick={onAboutClick}>
          About
        </Link>
        <SupportProjectNavLink
          className={styles.menuItem}
          onClick={onSupportClick}
        >
          <span className={styles.menuItemIcon} aria-hidden>
            <HeartThinIcon className={styles.supportNavIcon} />
          </span>
          {SUPPORT_PROJECT_NAV_LABEL}
        </SupportProjectNavLink>
        <button
          type="button"
          className={classNames(styles.menuItem, styles.menuItemLogout)}
          onClick={onLogout}
        >
          Logout
        </button>
      </nav>
    </section>
  );
}
