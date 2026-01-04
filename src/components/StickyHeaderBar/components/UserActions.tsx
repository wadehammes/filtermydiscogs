import { useRouter } from "next/navigation";
import { trackEvent } from "src/analytics/analytics";
import Button from "src/components/Button/Button.component";
import { ThemeSwitcher } from "src/components/ThemeSwitcher/ThemeSwitcher.component";
import { useAuth } from "src/context/auth.context";
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

  const handleLogout = async () => {
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

  const buttonSize = variant === "mobile" ? "sm" : "md";
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
        <span className={styles.username}>Welcome, {username}</span>
      )}

      <ThemeSwitcher variant={variant} />

      <Button variant="danger" size={buttonSize} onPress={handleLogout}>
        Logout
      </Button>
    </div>
  );
};
