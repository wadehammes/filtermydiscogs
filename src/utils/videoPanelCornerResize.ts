import type { VideoPanelPosition } from "src/utils/videoPanelLayoutStorage";

export type VideoPanelResizeCorner = "nw" | "ne" | "sw" | "se";

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
