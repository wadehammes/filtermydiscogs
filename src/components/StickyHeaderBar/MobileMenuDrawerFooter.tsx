import Link from "next/link";
import { SUPPORT_PROJECT_ABOUT_PATH } from "src/constants/supportProjectToast.constants";
import styles from "./MobileMenu.module.css";

interface MobileMenuDrawerFooterProps {
  username: string | null;
  onLogout: () => void;
  onAboutClick: () => void;
  onDonateClick: () => void;
  onSettingsClick: () => void;
}

export function MobileMenuDrawerFooter({
  username,
  onLogout,
  onAboutClick,
  onDonateClick,
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
        <Link
          href={SUPPORT_PROJECT_ABOUT_PATH}
          className={styles.aboutLink}
          onClick={onDonateClick}
        >
          Donate
        </Link>
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
