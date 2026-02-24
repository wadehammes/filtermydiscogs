import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import styles from "./MobileMenu.module.css";

interface MobileMenuDrawerFooterProps {
  username: string | null;
  isSyncDisabled: boolean;
  isSyncing: boolean;
  isCollectionLoading: boolean;
  onSyncClick: () => void;
  onLogout: () => void;
}

export function MobileMenuDrawerFooter({
  username,
  isSyncDisabled,
  isSyncing,
  isCollectionLoading,
  onSyncClick,
  onLogout,
}: MobileMenuDrawerFooterProps) {
  return (
    <div className={styles.menuFooter}>
      {username && (
        <div className={styles.userInfo}>
          <span>{username}</span>
        </div>
      )}
      <div className={styles.buttonGroup}>
        <ThemeSwitcher variant="mobile" />
        <button
          type="button"
          className={styles.syncButton}
          onClick={onSyncClick}
          disabled={isSyncDisabled}
          title={
            isCollectionLoading
              ? "Please wait for your collection to finish loading"
              : undefined
          }
        >
          {isSyncing
            ? "Syncing..."
            : isCollectionLoading
              ? "Loading..."
              : "Sync Collection"}
        </button>
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
