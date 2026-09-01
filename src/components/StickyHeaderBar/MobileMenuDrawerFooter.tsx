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
    <div className={styles.menuFooter}>
      {username && (
        <div className={styles.userInfo}>
          <span>{username}</span>
        </div>
      )}
      <div className={styles.buttonGroup}>
        <Link
          href="/settings"
          className={styles.aboutLink}
          onClick={onSettingsClick}
        >
          Settings
        </Link>
        <Link href="/about" className={styles.aboutLink} onClick={onAboutClick}>
          About
        </Link>
        <SupportProjectNavLink
          className={styles.aboutLink}
          onClick={onSupportClick}
        >
          <HeartThinIcon className={styles.supportNavIcon} />
          {SUPPORT_PROJECT_NAV_LABEL}
        </SupportProjectNavLink>
        <button
          type="button"
          className={styles.logoutButton}
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
