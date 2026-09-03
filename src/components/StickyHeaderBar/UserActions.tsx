import { Menu } from "@base-ui/react/menu";
import Link from "next/link";
import { useCallback, useState } from "react";
import { SupportProjectNavLink } from "src/components/SupportProjectNavLink/SupportProjectNavLink.component";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import { SUPPORT_PROJECT_NAV_LABEL } from "src/constants/supportProjectToast.constants";
import { useAuth } from "src/context/auth.context";
import Chevron from "src/styles/icons/chevron-right-thin.svg";
import { HeartThinIcon } from "src/styles/icons/HeartThinIcon.component";
import menuStyles from "src/styles/modules/inline-popover-menu.module.css";
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
  }, [logout]);

  const handleMenuNavigation = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const containerClass =
    variant === "mobile" ? styles.mobileActions : styles.userSection;

  return (
    <div className={containerClass}>
      {showMosaic && (
        <Link
          href="/mosaic"
          className={styles.mosaicLink}
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
              className={menuStyles.positioner}
              sideOffset={8}
            >
              <Menu.Popup className={styles.menuPopup}>
                <div className={styles.menuList}>
                  <Menu.LinkItem
                    closeOnClick
                    render={
                      <Link href="/settings" className={styles.menuLink} />
                    }
                    className={styles.menuItem}
                    onClick={handleMenuNavigation}
                  >
                    Settings
                  </Menu.LinkItem>
                  <Menu.LinkItem
                    closeOnClick
                    render={<Link href="/about" className={styles.menuLink} />}
                    className={styles.menuItem}
                    onClick={handleMenuNavigation}
                  >
                    About
                  </Menu.LinkItem>
                  <Menu.LinkItem
                    closeOnClick
                    render={
                      <SupportProjectNavLink
                        className={styles.menuLink}
                        onClick={handleMenuNavigation}
                      />
                    }
                    className={styles.menuItem}
                  >
                    <HeartThinIcon className={styles.supportNavIcon} />
                    {SUPPORT_PROJECT_NAV_LABEL}
                  </Menu.LinkItem>
                </div>
                <div className={styles.menuFooter}>
                  <ThemeSwitcher variant="menu" />
                </div>
                <div className={styles.menuFooter}>
                  <Menu.Item
                    className={styles.logoutItem}
                    onClick={() => {
                      void handleLogout();
                    }}
                  >
                    Logout
                  </Menu.Item>
                </div>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}
    </div>
  );
};
