import { useEffect } from "react";
import { DESKTOP_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";

export const useCloseMenuWhenFiltersBarHidden = ({
  variant,
  isOpen,
  onClose,
}: {
  variant: "bar" | "drawer";
  isOpen: boolean;
  onClose: () => void;
}) => {
  const isFiltersBarVisible = useMediaQuery(DESKTOP_LAYOUT_MEDIA_QUERY);

  useEffect(() => {
    if (variant === "bar" && !isFiltersBarVisible && isOpen) {
      onClose();
    }
  }, [isFiltersBarVisible, isOpen, onClose, variant]);
};
