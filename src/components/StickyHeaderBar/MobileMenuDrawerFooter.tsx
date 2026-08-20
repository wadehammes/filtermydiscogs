import Link from "next/link";
import styles from "./MobileMenu.module.css";

interface MobileMenuDrawerFooterProps {
  username: string | null;
  onLogout: () => void;
  onAboutClick: () => void;
  onSettingsClick: () => void;
}

export function MobileMenuDrawerFooter({
  username,
  onLogout,
  onAboutClick,
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
