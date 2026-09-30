import {
  LAYOUT_BREAKPOINT_DESKTOP_PX,
  LAYOUT_BREAKPOINT_TABLET_PX,
} from "src/constants/layoutMediaQueries";

export const isDesktopAppNavViewport = (
  viewport: { width: number; height: number } | null,
): boolean => (viewport?.width ?? 0) >= LAYOUT_BREAKPOINT_DESKTOP_PX;

export const isPublicDesktopNavViewport = (
  viewport: { width: number; height: number } | null,
): boolean => (viewport?.width ?? 0) >= LAYOUT_BREAKPOINT_TABLET_PX;
