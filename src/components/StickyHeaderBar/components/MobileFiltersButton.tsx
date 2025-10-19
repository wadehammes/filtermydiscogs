import { trackEvent } from "src/analytics/analytics";
import Button from "src/components/Button/Button.component";

interface MobileFiltersButtonProps {
  onFiltersClick: () => void;
  disabled?: boolean;
}

export const MobileFiltersButton = ({
  onFiltersClick,
  disabled = false,
}: MobileFiltersButtonProps) => {
  const handleFiltersClick = () => {
    onFiltersClick();
    trackEvent("filtersOpened", {
      action: "filtersOpenedFromHeader",
      category: "mobile_filters",
      label: "Filters Opened from Header",
      value: "mobile",
    });
  };

  if (disabled) {
    return null;
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onPress={handleFiltersClick}
      aria-label="Open filters"
    >
      <span>⚙️</span>
      <span>Filters</span>
    </Button>
  );
};
