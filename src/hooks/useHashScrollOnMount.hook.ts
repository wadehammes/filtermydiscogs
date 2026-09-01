import { useEffect } from "react";
import { matchesCurrentHash, scrollToPathHash } from "src/utils/hashNavigation";

export const useHashScrollOnMount = (hash: string) => {
  useEffect(() => {
    if (!matchesCurrentHash(hash)) {
      return;
    }

    requestAnimationFrame(() => {
      scrollToPathHash({
        pathname: window.location.pathname,
        hash,
        search: window.location.search,
      });
    });
  }, [hash]);
};
