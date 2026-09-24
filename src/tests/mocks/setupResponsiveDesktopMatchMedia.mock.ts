import { jest } from "@jest/globals";

export function setupResponsiveDesktopMatchMedia(initialDesktop: boolean) {
  let desktop = initialDesktop;
  const listeners = new Set<() => void>();

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      get matches() {
        if (query.includes("min-width: 1024px")) {
          return desktop;
        }

        if (query.includes("max-width: 1023px")) {
          return !desktop;
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
