import { jest } from "@jest/globals";
import {
  LAYOUT_BREAKPOINT_DESKTOP_PX,
  layoutMatchesMediaQueryAtWidth,
} from "src/constants/layoutMediaQueries";

export function setupResponsiveDesktopMatchMedia(initialDesktop: boolean) {
  let desktop = initialDesktop;
  const listeners = new Set<() => void>();

  const viewportWidth = () => (desktop ? LAYOUT_BREAKPOINT_DESKTOP_PX : 390);

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      get matches() {
        if (query.includes("min-width:") || query.includes("max-width:")) {
          return layoutMatchesMediaQueryAtWidth(query, viewportWidth());
        }

        return false;
      },
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: (_event: string, callback: () => void) => {
        listeners.add(callback);
      },
      removeEventListener: (_event: string, callback: () => void) => {
        listeners.delete(callback);
      },
      dispatchEvent: jest.fn(),
    }),
  });

  return {
    setDesktop(nextDesktop: boolean) {
      desktop = nextDesktop;
      listeners.forEach((callback) => {
        callback();
      });
    },
  };
}
