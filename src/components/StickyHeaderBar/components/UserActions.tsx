import classNames from "classnames";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import Button from "src/components/Button/Button.component";
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }

    return undefined;
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    trackEvent("logout", {
      action: "userLoggedOut",
      category: "auth",
      label: "User Logged Out",
      value: username || "unknown",
    });
  };

  const handleMosaicClick = () => {
    trackEvent("mosaicNavigation", {
      action: "mosaicNavigation",
      category: "navigation",
      label: "Navigate to Mosaic",
      value: "header",
    });
  };

  const handleNavigationClick = (label: string, value: string) => {
    setIsDropdownOpen(false);
    trackEvent("pageNavigation", {
      action: "pageNavigation",
      category: "navigation",
      label: `Navigate to ${label}`,
      value,
    });
  };

  const buttonSize = "sm";
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
        <div className={styles.userDropdown} ref={containerRef}>
          <button
            type="button"
            className={styles.usernameTrigger}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <span className={styles.username}>{username}</span>
            <span
              className={classNames(styles.chevronIcon, {
                [styles.chevronIconOpen]: isDropdownOpen,
              })}
              aria-hidden
            >
              <Chevron />
            </span>
          </button>
          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownItem}>
                <Link
                  href="/settings"
                  className={styles.dropdownLink}
                  onClick={() => handleNavigationClick("Settings", "settings")}
                >
                  Settings
                </Link>
              </div>
              <div className={styles.dropdownItem}>
                <Link
                  href="/about"
                  className={styles.dropdownLink}
                  onClick={() => handleNavigationClick("About", "about")}
                >
                  About
                </Link>
              </div>
              <div className={styles.dropdownItem}>
                <Button
                  variant="danger"
                  size={buttonSize}
                  onPress={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
