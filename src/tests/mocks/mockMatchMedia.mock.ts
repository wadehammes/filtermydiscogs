import {
  LAYOUT_BREAKPOINT_DESKTOP_PX,
  layoutMatchesMediaQueryAtWidth,
} from "src/constants/layoutMediaQueries";

type MockMatchMediaOptions = {
  coarsePointer?: boolean;
  desktop?: boolean;
  viewportWidthPx?: number;
};

export type MockCoarsePointerRestore = () => void;

const defaultViewportWidth = (desktop: boolean) =>
  desktop ? LAYOUT_BREAKPOINT_DESKTOP_PX : 390;

const queryMatches = (
  query: string,
  viewportWidthPx: number,
  coarsePointer: boolean,
) => {
  if (query.includes("(pointer: coarse)")) {
    return coarsePointer;
  }

  if (query.includes("min-width:") || query.includes("max-width:")) {
    return layoutMatchesMediaQueryAtWidth(query, viewportWidthPx);
  }

  return false;
};

export function setupMockMatchMedia({
  coarsePointer = false,
  desktop = false,
  viewportWidthPx,
}: MockMatchMediaOptions = {}) {
  const width = viewportWidthPx ?? defaultViewportWidth(desktop);

  const existingDescriptor = Object.getOwnPropertyDescriptor(
    window,
    "matchMedia",
  );

  if (existingDescriptor && !existingDescriptor.configurable) {
    return;
  }

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    enumerable: true,
    value: (query: string) => ({
      matches: queryMatches(query, width, coarsePointer),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
}

export const setupMockCoarsePointerWithoutNetworkInfo =
  (): MockCoarsePointerRestore => {
    const matchMedia = window.matchMedia;
    const navigatorWithConnection = navigator as Navigator & {
      connection?: object;
    };
    const originalConnection = navigatorWithConnection.connection;

    setupMockMatchMedia({ coarsePointer: true, viewportWidthPx: 390 });
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: undefined,
    });

    return () => {
      window.matchMedia = matchMedia;
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: originalConnection,
      });
    };
  };
