import {
  LAYOUT_BREAKPOINT_DESKTOP_PX,
  layoutMatchesMediaQueryAtWidth,
} from "src/constants/layoutMediaQueries";

type MockMatchMediaOptions = {
  desktop?: boolean;
  viewportWidthPx?: number;
};

const defaultViewportWidth = (desktop: boolean) =>
  desktop ? LAYOUT_BREAKPOINT_DESKTOP_PX : 390;

function queryMatches(query: string, viewportWidthPx: number) {
  if (query.includes("min-width:") || query.includes("max-width:")) {
    return layoutMatchesMediaQueryAtWidth(query, viewportWidthPx);
  }
  return false;
}

export function setupMockMatchMedia({
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
      matches: queryMatches(query, width),
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
