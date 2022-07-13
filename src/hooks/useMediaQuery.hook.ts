import { useState, useEffect } from "react";

export const useMediaQuery = (query: string, defaultValue: boolean = false) => {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media) {
      if (media.matches !== matches) {
        setMatches(media.matches);
      }

      const listener = () => {
        setMatches(media?.matches);
      };

      if (media?.addEventListener) {
        media.addEventListener("change", listener);
      } else {
        // Used as a fallback for browsers that don't support media.addEventListener
        media.addListener(listener);
      }

      return () => {
        if (media?.removeEventListener) {
          media.removeEventListener("change", listener);
        } else {
          media.removeListener(listener);
        }
      };
    }
  }, [matches, query]);

  return matches;
};
