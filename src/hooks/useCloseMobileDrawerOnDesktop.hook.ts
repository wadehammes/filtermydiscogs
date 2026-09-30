import { useEffect } from "react";
import { DESKTOP_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";

export { DESKTOP_LAYOUT_MEDIA_QUERY };

export const useCloseMobileDrawerOnDesktop = (onClose: () => void) => {
  const isDesktop = useMediaQuery(DESKTOP_LAYOUT_MEDIA_QUERY, false);

  useEffect(() => {
    if (isDesktop) {
      onClose();
    }
  }, [isDesktop, onClose]);
};
