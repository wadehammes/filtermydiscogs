import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useCloseMenuWhenFiltersBarHidden } from "src/components/FilterViewsMenu/useCloseMenuWhenFiltersBarHidden.hook";
import { act, renderHook } from "test-utils";

function setupResponsiveMatchMedia(initialDesktop: boolean) {
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

describe("useCloseMenuWhenFiltersBarHidden", () => {
  beforeEach(() => {
    setupResponsiveMatchMedia(true);
  });

  it("closes the bar menu when the filters bar breakpoint is crossed", () => {
    const media = setupResponsiveMatchMedia(true);
    const onClose = jest.fn();

    renderHook(() =>
      useCloseMenuWhenFiltersBarHidden({
        variant: "bar",
        isOpen: true,
        onClose,
      }),
    );

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      media.setDesktop(false);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close drawer menus on resize", () => {
    const media = setupResponsiveMatchMedia(true);
    const onClose = jest.fn();

    renderHook(() =>
      useCloseMenuWhenFiltersBarHidden({
        variant: "drawer",
        isOpen: true,
        onClose,
      }),
    );

    act(() => {
      media.setDesktop(false);
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
