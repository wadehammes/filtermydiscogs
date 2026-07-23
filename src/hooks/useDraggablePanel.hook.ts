import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearVideoPanelLayout,
  DEFAULT_VIDEO_PANEL_SCALE,
  readVideoPanelLayout,
  type VideoPanelLayout,
  type VideoPanelPosition,
  writeVideoPanelLayout,
} from "src/utils/videoPanelLayoutStorage";

interface UseDraggablePanelParams {
  enabled: boolean;
  storageKey?: string;
  minScale?: number;
  maxScale?: number;
}

const DEFAULT_MIN_SCALE = 0.45;
const DEFAULT_MAX_SCALE = DEFAULT_VIDEO_PANEL_SCALE;

const clampPosition = ({
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

const clampScale = ({
  scale,
  minScale,
  maxScale,
}: {
  scale: number;
  minScale: number;
  maxScale: number;
}): number => {
  return Math.min(Math.max(scale, minScale), maxScale);
};

export const useDraggablePanel = ({
  enabled,
  storageKey,
  minScale = DEFAULT_MIN_SCALE,
  maxScale = DEFAULT_MAX_SCALE,
}: UseDraggablePanelParams) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0 });
  const maxWidthRef = useRef<number | null>(null);
  const hasHydratedLayoutRef = useRef(false);
  const storedLayout = storageKey ? readVideoPanelLayout(storageKey) : null;
  const [hasHydratedLayout, setHasHydratedLayout] = useState(
    () => !storedLayout?.position,
  );
  const [position, setPosition] = useState<VideoPanelPosition | null>(null);
  const [scale, setScale] = useState(() =>
    clampScale({
      scale: storedLayout?.scale ?? DEFAULT_MAX_SCALE,
      minScale,
      maxScale,
    }),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const measureMaxWidth = useCallback(() => {
    const panel = panelRef.current;

    if (!panel || scale <= 0) {
      return null;
    }

    const width = panel.getBoundingClientRect().width / scale;

    maxWidthRef.current = width;

    return width;
  }, [scale]);

  const clampPanelPosition = useCallback(
    (nextPosition: VideoPanelPosition): VideoPanelPosition => {
      const panel = panelRef.current;

      if (!panel) {
        return nextPosition;
      }

      const { width, height } = panel.getBoundingClientRect();

      return clampPosition({
        x: nextPosition.x,
        y: nextPosition.y,
        width,
        height,
      });
    },
    [],
  );

  const resetLayout = useCallback(() => {
    setPosition(null);
    setScale(DEFAULT_MAX_SCALE);

    if (storageKey) {
      clearVideoPanelLayout(storageKey);
    }
  }, [storageKey]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!(enabled && panelRef.current)) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      const rect = panelRef.current.getBoundingClientRect();

      dragOffsetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      setPosition((currentPosition) => {
        if (currentPosition) {
          return currentPosition;
        }

        return { x: rect.left, y: rect.top };
      });
      setIsDragging(true);
    },
    [enabled],
  );

  const handleResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!(enabled && panelRef.current)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);

      const maxWidth =
        measureMaxWidth() ?? panelRef.current.getBoundingClientRect().width;
      const { width } = panelRef.current.getBoundingClientRect();

      resizeStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        width,
      };
      maxWidthRef.current = maxWidth;

      setPosition((currentPosition) => {
        if (currentPosition) {
          return currentPosition;
        }

        const rect = panelRef.current?.getBoundingClientRect();

        if (!rect) {
          return currentPosition;
        }

        return { x: rect.left, y: rect.top };
      });
      setIsResizing(true);
    },
    [enabled, measureMaxWidth],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    measureMaxWidth();
  }, [enabled, measureMaxWidth]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (hasHydratedLayoutRef.current) {
      return;
    }

    let frameId = 0;

    const hydrateStoredLayout = () => {
      const panel = panelRef.current;
      const storedPosition = storageKey
        ? readVideoPanelLayout(storageKey)?.position
        : null;

      if (!storedPosition) {
        hasHydratedLayoutRef.current = true;
        setHasHydratedLayout(true);
        return;
      }

      if (!panel) {
        frameId = requestAnimationFrame(hydrateStoredLayout);
        return;
      }

      const { width, height } = panel.getBoundingClientRect();

      if (width <= 0 || height <= 0) {
        frameId = requestAnimationFrame(hydrateStoredLayout);
        return;
      }

      measureMaxWidth();

      const clamped = clampPosition({
        x: storedPosition.x,
        y: storedPosition.y,
        width,
        height,
      });
      const fitsCurrentViewport =
        clamped.x === storedPosition.x && clamped.y === storedPosition.y;

      if (fitsCurrentViewport) {
        setPosition(clamped);
      } else if (storageKey) {
        clearVideoPanelLayout(storageKey);
      }

      hasHydratedLayoutRef.current = true;
      setHasHydratedLayout(true);
    };

    frameId = requestAnimationFrame(hydrateStoredLayout);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [enabled, measureMaxWidth, storageKey]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const panel = panelRef.current;

      if (!panel) {
        return;
      }

      const { width, height } = panel.getBoundingClientRect();

      setPosition(
        clampPosition({
          x: event.clientX - dragOffsetRef.current.x,
          y: event.clientY - dragOffsetRef.current.y,
          width,
          height,
        }),
      );
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const maxWidth = maxWidthRef.current;

      if (!maxWidth) {
        return;
      }

      const delta = Math.max(
        event.clientX - resizeStartRef.current.x,
        event.clientY - resizeStartRef.current.y,
      );
      const minWidth = maxWidth * minScale;
      const nextWidth = Math.min(
        Math.max(resizeStartRef.current.width + delta, minWidth),
        maxWidth,
      );
      const nextScale = clampScale({
        scale: nextWidth / maxWidth,
        minScale,
        maxScale,
      });

      setScale(nextScale);

      setPosition((currentPosition) => {
        if (!currentPosition) {
          return currentPosition;
        }

        return clampPanelPosition(currentPosition);
      });
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [clampPanelPosition, isResizing, maxScale, minScale]);

  useEffect(() => {
    if (!storageKey || isDragging || isResizing || !hasHydratedLayout) {
      return;
    }

    if (position === null && scale === DEFAULT_MAX_SCALE) {
      clearVideoPanelLayout(storageKey);
      return;
    }

    const layout: VideoPanelLayout = { position, scale };

    writeVideoPanelLayout(storageKey, layout);
  }, [hasHydratedLayout, isDragging, isResizing, position, scale, storageKey]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleResize = () => {
      measureMaxWidth();

      setPosition((currentPosition) => {
        if (!currentPosition) {
          return currentPosition;
        }

        return clampPanelPosition(currentPosition);
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [clampPanelPosition, enabled, measureMaxWidth]);

  return {
    panelRef,
    position,
    scale,
    isDragging,
    isResizing,
    handlePointerDown,
    handleResizePointerDown,
    resetLayout,
  };
};
