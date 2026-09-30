export const LAYOUT_BREAKPOINT_TABLET_PX = 768 as const;
export const LAYOUT_BREAKPOINT_DESKTOP_PX = 1024 as const;

export const DESKTOP_LAYOUT_MEDIA_QUERY = `(min-width: ${LAYOUT_BREAKPOINT_DESKTOP_PX}px)`;

export const BELOW_DESKTOP_LAYOUT_MEDIA_QUERY = `(max-width: ${LAYOUT_BREAKPOINT_DESKTOP_PX - 1}px)`;

export const COMPACT_LAYOUT_MEDIA_QUERY = `(max-width: ${LAYOUT_BREAKPOINT_TABLET_PX}px)`;

export const TABLET_UP_MEDIA_QUERY = `(min-width: ${LAYOUT_BREAKPOINT_TABLET_PX}px)`;

export const RESPONSIVE_VIEWPORT_PRESETS = {
  phonePortrait: { width: 390, height: 844 },
  phoneLandscape: { width: 844, height: 390 },
  tabletPortrait: { width: 768, height: 1024 },
  tabletLandscape: { width: 1024, height: 768 },
  laptop: { width: 1280, height: 800 },
  laptopWithDrawer: { width: 1280, height: 800 },
} as const;

const DESKTOP_MIN_WIDTH_FRAGMENT = `min-width: ${LAYOUT_BREAKPOINT_DESKTOP_PX}px`;
const TABLET_MIN_WIDTH_FRAGMENT = `min-width: ${LAYOUT_BREAKPOINT_TABLET_PX}px`;
const BELOW_DESKTOP_MAX_WIDTH_FRAGMENT = `max-width: ${LAYOUT_BREAKPOINT_DESKTOP_PX - 1}px`;
const COMPACT_MAX_WIDTH_FRAGMENT = `max-width: ${LAYOUT_BREAKPOINT_TABLET_PX}px`;

export const layoutMatchesMediaQueryAtWidth = (
  query: string,
  viewportWidthPx: number,
): boolean => {
  if (query.includes(DESKTOP_MIN_WIDTH_FRAGMENT)) {
    return viewportWidthPx >= LAYOUT_BREAKPOINT_DESKTOP_PX;
  }
  if (query.includes(TABLET_MIN_WIDTH_FRAGMENT)) {
    return viewportWidthPx >= LAYOUT_BREAKPOINT_TABLET_PX;
  }
  if (
    query.includes(BELOW_DESKTOP_MAX_WIDTH_FRAGMENT) ||
    query.includes("max-width: 1023px")
  ) {
    return viewportWidthPx < LAYOUT_BREAKPOINT_DESKTOP_PX;
  }
  if (query.includes(COMPACT_MAX_WIDTH_FRAGMENT)) {
    return viewportWidthPx <= LAYOUT_BREAKPOINT_TABLET_PX;
  }
  return false;
};
