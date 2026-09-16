import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import {
  getVideoPanelHeightForWidth,
  getVideoPanelPositionAfterResize,
  getVideoPanelResizeDelta,
  readVideoPanelChromeHeightPx,
  type VideoPanelResizeCorner,
} from "src/utils/videoPanelCornerResize";
import {
  clearVideoPanelLayout,
  DEFAULT_VIDEO_PANEL_INITIAL_SCALE,
  DEFAULT_VIDEO_PANEL_SCALE,
  getVideoPanelMaxScaleForYoutubeEmbed,
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
const DRAG_ACTIVATION_PX = 4;

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

const applyLayoutToPanel = (
  panel: HTMLDivElement,
  layout: { position: VideoPanelPosition | null; scale: number },
) => {
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

export const useDraggablePanel = ({
  enabled,
  storageKey,
  minScale = DEFAULT_MIN_SCALE,
  maxScale: maxScaleOverride,
}: UseDraggablePanelParams) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragClampSizeRef = useRef({ width: 0, height: 0 });
  const resizeStartRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    chromeHeight: number;
    position: VideoPanelPosition;
    corner: VideoPanelResizeCorner;
  }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    chromeHeight: 0,
    position: { x: 0, y: 0 },
    corner: "se",
  });
  const maxWidthRef = useRef<number | null>(null);
  const maxScaleRef = useRef(DEFAULT_VIDEO_PANEL_SCALE);
  const hasHydratedLayoutRef = useRef(false);
  const pointerFrameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const liveLayoutRef = useRef<{
    position: VideoPanelPosition | null;
    scale: number;
  }>({
    position: null,
    scale: DEFAULT_VIDEO_PANEL_INITIAL_SCALE,
  });
  const [hasHydratedLayout, setHasHydratedLayout] = useState(() => {
    if (!storageKey) {
      return true;
    }

    return !readVideoPanelLayout(storageKey)?.position;
  });
  const [position, setPosition] = useState<VideoPanelPosition | null>(null);
  const [scale, setScale] = useState(() => {
    if (!storageKey) {
      return DEFAULT_VIDEO_PANEL_INITIAL_SCALE;
    }

    return (
      readVideoPanelLayout(storageKey)?.scale ??
      DEFAULT_VIDEO_PANEL_INITIAL_SCALE
    );
  });

  const resolveMaxScale = useCallback((): number => {
    return maxScaleOverride ?? maxScaleRef.current;
  }, [maxScaleOverride]);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragPending, setIsDragPending] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragPointerStartRef = useRef({ x: 0, y: 0 });

  const measureMaxWidth = useCallback(() => {
    const panel = panelRef.current;

    if (!panel || liveLayoutRef.current.scale <= 0) {
      return null;
    }

    const width =
      panel.getBoundingClientRect().width / liveLayoutRef.current.scale;

    maxWidthRef.current = width;
    maxScaleRef.current = getVideoPanelMaxScaleForYoutubeEmbed(width);

    return width;
  }, []);

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

  const commitLiveLayout = useCallback(() => {
    const panel = panelRef.current;
    const { position: nextPosition, scale: nextScale } = liveLayoutRef.current;

    if (panel) {
      applyLayoutToPanel(panel, { position: nextPosition, scale: nextScale });
    }

    setPosition(nextPosition);
    setScale(nextScale);
  }, []);

  const schedulePointerUpdate = useCallback((update: () => void) => {
    if (pointerFrameRef.current !== null) {
      return;
    }

    pointerFrameRef.current = requestAnimationFrame(() => {
      pointerFrameRef.current = null;
      update();
    });
  }, []);

  const clearFloatingPosition = useCallback(() => {
    liveLayoutRef.current = {
      position: null,
      scale: liveLayoutRef.current.scale,
    };
    setPosition(null);

    const panel = panelRef.current;

    if (panel) {
      applyLayoutToPanel(panel, liveLayoutRef.current);
    }
  }, []);

  const resetLayout = useCallback(() => {
    liveLayoutRef.current = {
      position: null,
      scale: DEFAULT_VIDEO_PANEL_INITIAL_SCALE,
    };
    setPosition(null);
    setScale(DEFAULT_VIDEO_PANEL_INITIAL_SCALE);

    const panel = panelRef.current;

    if (panel) {
      applyLayoutToPanel(panel, liveLayoutRef.current);
    }

    if (storageKey) {
      clearVideoPanelLayout(storageKey);
    }
  }, [storageKey]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!(enabled && panelRef.current)) {
        return;
      }

      if (
        event.target instanceof Element &&
        event.target.closest("button, a")
      ) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      const rect = panelRef.current.getBoundingClientRect();
      dragClampSizeRef.current = { width: rect.width, height: rect.height };

      dragOffsetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      dragPointerStartRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
      setIsDragPending(true);
    },
    [enabled],
  );

  useEffect(() => {
    if (!isDragPending) {
      return;
    }

    const activateDrag = (event: PointerEvent) => {
      const panel = panelRef.current;

      if (!panel) {
        return;
      }

      const { width, height } = dragClampSizeRef.current;
      const nextPosition = clampPosition({
        x: event.clientX - dragOffsetRef.current.x,
        y: event.clientY - dragOffsetRef.current.y,
        width,
        height,
      });

      liveLayoutRef.current = {
        position: nextPosition,
        scale: liveLayoutRef.current.scale,
      };
      applyLayoutToPanel(panel, liveLayoutRef.current);
      setPosition(nextPosition);
      setIsDragPending(false);
      setIsDragging(true);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = event.clientX - dragPointerStartRef.current.x;
      const deltaY = event.clientY - dragPointerStartRef.current.y;

      if (Math.hypot(deltaX, deltaY) < DRAG_ACTIVATION_PX) {
        return;
      }

      activateDrag(event);
    };

    const handlePointerUp = () => {
      setIsDragPending(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragPending]);

  const handleResizePointerDown = useCallback(
    (corner: VideoPanelResizeCorner) =>
      (event: React.PointerEvent<HTMLElement>) => {
        if (!(enabled && panelRef.current)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);

        const rect = panelRef.current.getBoundingClientRect();
        const maxWidth = measureMaxWidth() ?? rect.width;

        maxWidthRef.current = maxWidth;

        const shouldSetPosition = liveLayoutRef.current.position === null;
        const nextPosition = liveLayoutRef.current.position ?? {
          x: rect.left,
          y: rect.top,
        };

        resizeStartRef.current = {
          x: event.clientX,
          y: event.clientY,
          width: rect.width,
          height: rect.height,
          chromeHeight: readVideoPanelChromeHeightPx(panelRef.current),
          position: nextPosition,
          corner,
        };

        liveLayoutRef.current = {
          position: nextPosition,
          scale: liveLayoutRef.current.scale,
        };
        applyLayoutToPanel(panelRef.current, liveLayoutRef.current);

        if (shouldSetPosition) {
          setPosition(nextPosition);
        }

        setIsResizing(true);
      },
    [enabled, measureMaxWidth],
  );

  useEffect(() => {
    if (isDragging || isResizing) {
      return;
    }

    liveLayoutRef.current = { position, scale };
  }, [isDragging, isResizing, position, scale]);

  const measurePanelMaxWidth = useEffectEvent(() => {
    measureMaxWidth();
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    measureMaxWidth();
    setScale((current) =>
      clampScale({
        scale: current,
        minScale,
        maxScale: resolveMaxScale(),
      }),
    );
  }, [enabled, measureMaxWidth, minScale, resolveMaxScale]);

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

      measurePanelMaxWidth();

      const clamped = clampPosition({
        x: storedPosition.x,
        y: storedPosition.y,
        width,
        height,
      });
      const fitsCurrentViewport =
        clamped.x === storedPosition.x && clamped.y === storedPosition.y;

      if (fitsCurrentViewport) {
        liveLayoutRef.current = {
          position: clamped,
          scale: liveLayoutRef.current.scale,
        };
        applyLayoutToPanel(panel, liveLayoutRef.current);
        setPosition(clamped);
      } else {
        liveLayoutRef.current = {
          position: null,
          scale: DEFAULT_VIDEO_PANEL_INITIAL_SCALE,
        };
        applyLayoutToPanel(panel, liveLayoutRef.current);
        setPosition(null);
        setScale(DEFAULT_VIDEO_PANEL_INITIAL_SCALE);

        if (storageKey) {
          clearVideoPanelLayout(storageKey);
        }
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
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      pendingPointerRef.current = { x: event.clientX, y: event.clientY };

      schedulePointerUpdate(() => {
        const panel = panelRef.current;
        const pending = pendingPointerRef.current;

        if (!(panel && pending)) {
          return;
        }

        const { width, height } = dragClampSizeRef.current;
        const nextPosition = clampPosition({
          x: pending.x - dragOffsetRef.current.x,
          y: pending.y - dragOffsetRef.current.y,
          width,
          height,
        });

        liveLayoutRef.current = {
          position: nextPosition,
          scale: liveLayoutRef.current.scale,
        };
        applyLayoutToPanel(panel, liveLayoutRef.current);
      });
    };

    const handlePointerUp = () => {
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }

      commitLiveLayout();
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }
    };
  }, [commitLiveLayout, isDragging, schedulePointerUpdate]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      pendingPointerRef.current = { x: event.clientX, y: event.clientY };

      schedulePointerUpdate(() => {
        const panel = panelRef.current;
        const pending = pendingPointerRef.current;
        const maxWidth = maxWidthRef.current;

        if (!(panel && pending && maxWidth)) {
          return;
        }

        const {
          x: startPointerX,
          y: startPointerY,
          width: startWidth,
          height: startHeight,
          chromeHeight,
          position: startPosition,
          corner,
        } = resizeStartRef.current;
        const delta = getVideoPanelResizeDelta(
          corner,
          pending.x - startPointerX,
          pending.y - startPointerY,
        );
        const effectiveMaxScale = resolveMaxScale();
        const minWidth = maxWidth * minScale;
        const maxRenderedWidth = maxWidth * effectiveMaxScale;
        const nextWidth = Math.min(
          Math.max(startWidth + delta, minWidth),
          maxRenderedWidth,
        );
        const nextHeight = getVideoPanelHeightForWidth({
          startWidth,
          startHeight,
          nextWidth,
          chromeHeight,
        });
        const nextScale = clampScale({
          scale: nextWidth / maxWidth,
          minScale,
          maxScale: effectiveMaxScale,
        });
        const nextPosition = getVideoPanelPositionAfterResize({
          corner,
          startPosition,
          startWidth,
          startHeight,
          nextWidth,
          nextHeight,
        });

        liveLayoutRef.current = {
          position: nextPosition,
          scale: nextScale,
        };
        applyLayoutToPanel(panel, liveLayoutRef.current);
      });
    };

    const handlePointerUp = () => {
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }

      if (liveLayoutRef.current.position) {
        liveLayoutRef.current = {
          position: clampPanelPosition(liveLayoutRef.current.position),
          scale: liveLayoutRef.current.scale,
        };
      }

      commitLiveLayout();
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }
    };
  }, [
    clampPanelPosition,
    commitLiveLayout,
    isResizing,
    minScale,
    resolveMaxScale,
    schedulePointerUpdate,
  ]);

  useEffect(() => {
    if (!storageKey || isDragging || isResizing || !hasHydratedLayout) {
      return;
    }

    if (position === null && scale === DEFAULT_VIDEO_PANEL_INITIAL_SCALE) {
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

        const clamped = clampPanelPosition(currentPosition);

        liveLayoutRef.current = {
          position: clamped,
          scale: liveLayoutRef.current.scale,
        };

        const panel = panelRef.current;

        if (panel) {
          applyLayoutToPanel(panel, liveLayoutRef.current);
        }

        return clamped;
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [clampPanelPosition, enabled, measureMaxWidth]);

  const isInteracting = isDragging || isResizing;

  return {
    panelRef,
    position:
      isInteracting && liveLayoutRef.current.position
        ? liveLayoutRef.current.position
        : position,
    scale: isInteracting ? liveLayoutRef.current.scale : scale,
    isDragging,
    isResizing,
    handlePointerDown,
    handleResizePointerDown,
    clearFloatingPosition,
    resetLayout,
  };
};
