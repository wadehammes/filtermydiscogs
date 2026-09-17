import type { VideoPanelPosition } from "src/utils/videoPanelLayoutStorage";

export const clampVideoPanelPosition = ({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}): VideoPanelPosition => {
  const maxX = Math.max(window.innerWidth - width, 0);
  const maxY = Math.max(window.innerHeight - height, 0);

  return {
    x: Math.min(Math.max(x, 0), maxX),
    y: Math.min(Math.max(y, 0), maxY),
  };
};

export const clampVideoPanelScale = ({
  scale,
  minScale,
  maxScale,
}: {
  scale: number;
  minScale: number;
  maxScale: number;
}): number => Math.min(Math.max(scale, minScale), maxScale);

export const applyVideoPanelLayoutToElement = (
  panel: HTMLDivElement,
  layout: { position: VideoPanelPosition | null; scale: number },
): void => {
  panel.style.setProperty("--panel-scale", String(layout.scale));

  if (layout.position) {
    panel.style.left = `${layout.position.x}px`;
    panel.style.top = `${layout.position.y}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    return;
  }

  panel.style.removeProperty("left");
  panel.style.removeProperty("top");
  panel.style.removeProperty("right");
  panel.style.removeProperty("bottom");
};
