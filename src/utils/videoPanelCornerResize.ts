import type { VideoPanelPosition } from "src/utils/videoPanelLayoutStorage";

export type VideoPanelResizeCorner = "nw" | "ne" | "sw" | "se";

export const readVideoPanelChromeHeightPx = (panel: HTMLElement): number => {
  const value = getComputedStyle(panel)
    .getPropertyValue("--video-panel-chrome-height")
    .trim();

  if (!value) {
    return 0;
  }

  const remMatch = /^([\d.]+)rem$/.exec(value);

  if (remMatch?.[1]) {
    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );

    return Number.parseFloat(remMatch[1]) * rootFontSize;
  }

  const px = Number.parseFloat(value);

  return Number.isFinite(px) ? px : 0;
};

export const getVideoPanelHeightForWidth = ({
  startWidth,
  startHeight,
  nextWidth,
  chromeHeight,
}: {
  startWidth: number;
  startHeight: number;
  nextWidth: number;
  chromeHeight: number;
}): number => {
  if (startWidth <= 0) {
    return startHeight;
  }

  const startVideoHeight = Math.max(startHeight - chromeHeight, 0);

  return chromeHeight + startVideoHeight * (nextWidth / startWidth);
};

export const getVideoPanelResizeDelta = (
  corner: VideoPanelResizeCorner,
  dx: number,
  dy: number,
): number => {
  switch (corner) {
    case "se":
      return Math.max(dx, dy);
    case "nw":
      return Math.max(-dx, -dy);
    case "ne":
      return Math.max(dx, -dy);
    case "sw":
      return Math.max(-dx, dy);
  }
};

export const getVideoPanelPositionAfterResize = ({
  corner,
  startPosition,
  startWidth,
  startHeight,
  nextWidth,
  nextHeight,
}: {
  corner: VideoPanelResizeCorner;
  startPosition: VideoPanelPosition;
  startWidth: number;
  startHeight: number;
  nextWidth: number;
  nextHeight: number;
}): VideoPanelPosition => {
  const widthDelta = startWidth - nextWidth;
  const heightDelta = startHeight - nextHeight;

  switch (corner) {
    case "se":
      return startPosition;
    case "nw":
      return {
        x: startPosition.x + widthDelta,
        y: startPosition.y + heightDelta,
      };
    case "ne":
      return {
        x: startPosition.x,
        y: startPosition.y + heightDelta,
      };
    case "sw":
      return {
        x: startPosition.x + widthDelta,
        y: startPosition.y,
      };
  }
};
