import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import Button from "src/components/Button/Button.component";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import { useAuth } from "src/context/auth.context";
import Chevron from "src/styles/icons/chevron-right-solid.svg";
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
  const router = useRouter();
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
    router.push("/mosaic");
  };

  const buttonSize = "sm";
  const containerClass =
    variant === "mobile" ? styles.mobileActions : styles.userSection;

  return (
    <div className={containerClass}>
      {showMosaic && (
        <Button
          variant="secondary"
          size={buttonSize}
          onPress={handleMosaicClick}
          aria-label="View mosaic"
        >
          <span>🖼️</span>
          <span>Mosaic</span>
        </Button>
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
            <Chevron
              className={`${styles.chevron} ${
                isDropdownOpen ? styles.chevronOpen : ""
              }`}
            />
          </button>
          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownItem}>
                <ThemeSwitcher variant="desktop" />
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
