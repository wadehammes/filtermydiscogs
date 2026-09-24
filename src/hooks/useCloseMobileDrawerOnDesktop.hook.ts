import { useEffect } from "react";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";

export const DESKTOP_LAYOUT_MEDIA_QUERY = "(min-width: 1024px)";

export const useCloseMobileDrawerOnDesktop = (onClose: () => void) => {
  const isDesktop = useMediaQuery(DESKTOP_LAYOUT_MEDIA_QUERY, false);

  useEffect(() => {
    if (isDesktop) {
      onClose();
    }
  }, [isDesktop, onClose]);
};
