export const VIDEO_PANEL_LAYOUT_STORAGE_KEY =
  "filtermydiscogs_release_playback_video_panel_layout";

export interface VideoPanelPosition {
  x: number;
  y: number;
}

export interface VideoPanelLayout {
  position: VideoPanelPosition | null;
  scale: number;
}

export const DEFAULT_VIDEO_PANEL_SCALE = 1;

const isVideoPanelPosition = (value: unknown): value is VideoPanelPosition => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as VideoPanelPosition;

  return (
    typeof candidate.x === "number" &&
    typeof candidate.y === "number" &&
    Number.isFinite(candidate.x) &&
    Number.isFinite(candidate.y)
  );
};

const isVideoPanelLayout = (value: unknown): value is VideoPanelLayout => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as VideoPanelLayout;
  const { position, scale } = candidate;

  if (position !== null && !isVideoPanelPosition(position)) {
    return false;
  }

  return typeof scale === "number" && Number.isFinite(scale) && scale > 0;
};

export const readVideoPanelLayout = (
  storageKey: string,
): VideoPanelLayout | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(storageKey);

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (isVideoPanelPosition(parsed)) {
      return { position: parsed, scale: DEFAULT_VIDEO_PANEL_SCALE };
    }

    if (!isVideoPanelLayout(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const writeVideoPanelLayout = (
  storageKey: string,
  layout: VideoPanelLayout,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(storageKey, JSON.stringify(layout));
};

export const clearVideoPanelLayout = (storageKey: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(storageKey);
};
