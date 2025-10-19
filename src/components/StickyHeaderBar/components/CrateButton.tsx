import { trackEvent } from "src/analytics/analytics";
import Button from "src/components/Button/Button.component";
import { useCrate } from "src/context/crate.context";
import styles from "./CrateButton.module.css";

interface CrateButtonProps {
  variant?: "mobile" | "desktop";
  disabled?: boolean;
}

export const CrateButton = ({
  variant = "desktop",
  disabled = false,
}: CrateButtonProps) => {
  const { selectedReleases, openDrawer } = useCrate();

  const handleCrateClick = () => {
    openDrawer();
    trackEvent("crateOpened", {
      action: "crateOpenedFromHeader",
      category: "crate",
      label: "Crate Opened from Header",
      value: selectedReleases.length.toString(),
    });
  };

  if (selectedReleases.length === 0 || disabled) {
    return null;
  }

  const buttonSize = variant === "mobile" ? "sm" : "md";
  const className = variant === "desktop" ? styles.desktopCrateButton : "";

  return (
    <Button
      className={className || ""}
      variant="primary"
      size={buttonSize}
      onPress={handleCrateClick}
      aria-label={`Open crate with ${selectedReleases.length} items`}
    >
      <span>My Crate</span>
      <span className={styles.crateCount}>{selectedReleases.length}</span>
    </Button>
  );
};
