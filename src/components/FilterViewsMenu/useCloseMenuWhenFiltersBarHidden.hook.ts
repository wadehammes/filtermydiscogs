import { useEffect } from "react";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";

export const FILTERS_BAR_MEDIA_QUERY = "(min-width: 1024px)";

export const useCloseMenuWhenFiltersBarHidden = ({
  variant,
  isOpen,
  onClose,
}: {
  variant: "bar" | "drawer";
  isOpen: boolean;
  onClose: () => void;
}) => {
  const isFiltersBarVisible = useMediaQuery(FILTERS_BAR_MEDIA_QUERY);

  useEffect(() => {
    if (variant === "bar" && !isFiltersBarVisible && isOpen) {
      onClose();
    }
  }, [isFiltersBarVisible, isOpen, onClose, variant]);
};
