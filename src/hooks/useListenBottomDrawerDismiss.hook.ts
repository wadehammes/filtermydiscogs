import { useEffect } from "react";
import { BOTTOM_DRAWER_DISMISS_EVENT } from "src/constants/bottomDrawerDismiss";

export const useListenBottomDrawerDismiss = (onDismiss: () => void) => {
  useEffect(() => {
    const handler = () => {
      onDismiss();
    };

    window.addEventListener(BOTTOM_DRAWER_DISMISS_EVENT, handler);

    return () => {
      window.removeEventListener(BOTTOM_DRAWER_DISMISS_EVENT, handler);
    };
  }, [onDismiss]);
};
