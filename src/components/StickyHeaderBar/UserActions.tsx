import { Menu } from "@base-ui/react/menu";
import Link from "next/link";
import { useCallback, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import { useAuth } from "src/context/auth.context";
import Chevron from "src/styles/icons/chevron-right-thin.svg";
import styles from "./UserActions.module.css";

interface UserActionsProps {
  variant?: "mobile" | "desktop";
  showMosaic?: boolean;
  showUsername?: boolean;
}

export const UserActions = ({
  variant = "desktop",
  showMosaic = true,
  showUsername = true,
}: UserActionsProps) => {
  const { logout, state: authState } = useAuth();
  const { username } = authState;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsDropdownOpen(false);
    await logout();
    trackEvent("logout", {
      action: "userLoggedOut",
      category: "auth",
      label: "User Logged Out",
      value: username || "unknown",
    });
  }, [logout, username]);

  const handleMosaicClick = () => {
    trackEvent("mosaicNavigation", {
      action: "mosaicNavigation",
      category: "navigation",
      label: "Navigate to Mosaic",
      value: "header",
    });
  };

  const handleNavigationClick = useCallback((label: string, value: string) => {
    setIsDropdownOpen(false);
    trackEvent("pageNavigation", {
      action: "pageNavigation",
      category: "navigation",
      label: `Navigate to ${label}`,
      value,
    });
  }, []);

  const containerClass =
    variant === "mobile" ? styles.mobileActions : styles.userSection;

  return (
    <div className={containerClass}>
      {showMosaic && (
        <Link
          href="/mosaic"
          className={styles.mosaicLink}
          onClick={handleMosaicClick}
          aria-label="View mosaic"
        >
          <span>🖼️</span>
          <span>Mosaic</span>
        </Link>
      )}

      {showUsername && username && (
        <Menu.Root
          open={isDropdownOpen}
          onOpenChange={setIsDropdownOpen}
          modal={false}
        >
          <Menu.Trigger className={styles.usernameTrigger}>
            <span className={styles.username}>{username}</span>
            <span className={styles.chevronIcon} aria-hidden>
              <Chevron />
            </span>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner
              align="end"
              className={styles.positioner}
              sideOffset={8}
            >
              <Menu.Popup className={styles.dropdown}>
                <Menu.LinkItem
                  closeOnClick
                  render={
                    <Link href="/settings" className={styles.dropdownLink} />
                  }
                  onClick={() => {
                    handleNavigationClick("Settings", "settings");
                  }}
                >
                  Settings
                </Menu.LinkItem>
                <Menu.LinkItem
                  closeOnClick
                  render={
                    <Link href="/about" className={styles.dropdownLink} />
                  }
                  onClick={() => {
                    handleNavigationClick("About", "about");
                  }}
                >
                  About
                </Menu.LinkItem>
                <Menu.Separator className={styles.menuSeparator} />
                <ThemeSwitcher variant="menu" />
                <Menu.Separator className={styles.menuSeparator} />
                <Menu.Item
                  className={styles.logoutItem}
                  onClick={() => {
                    void handleLogout();
                  }}
                >
                  Logout
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}
    </div>
  );
};
