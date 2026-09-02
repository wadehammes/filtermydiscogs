import { useVirtualizer } from "@tanstack/react-virtual";
import { type RefObject, useEffect, useMemo, useState } from "react";

const GRID_BREAKPOINT_PX = 768;
const GRID_MIN_COLUMN_WIDTH_PX = 280;
const GRID_HORIZONTAL_PADDING_PX = 32;
const GRID_GAP_PX = 16;
const DESKTOP_ROW_ESTIMATE_PX = 420;
const MOBILE_ROW_ESTIMATE_PX = 112;
const ROW_OVERSCAN = 4;
const INITIAL_FALLBACK_ROWS = ROW_OVERSCAN + 2;

export const getReleaseGridColumnCount = (
  containerWidth: number,
  forceSingleColumn: boolean,
): number => {
  if (forceSingleColumn || containerWidth <= GRID_BREAKPOINT_PX) {
    return 1;
  }

  const contentWidth = Math.max(0, containerWidth - GRID_HORIZONTAL_PADDING_PX);

  return Math.max(
    1,
    Math.floor(
      (contentWidth + GRID_GAP_PX) / (GRID_MIN_COLUMN_WIDTH_PX + GRID_GAP_PX),
    ),
  );
};

interface UseVirtualizedReleaseGridOptions {
  releaseCount: number;
  scrollElement: HTMLElement | null;
  gridContainerRef: RefObject<HTMLElement | null>;
  forceSingleColumn: boolean;
  enabled?: boolean;
}

export const useVirtualizedReleaseGrid = ({
  releaseCount,
  scrollElement,
  gridContainerRef,
  forceSingleColumn,
  enabled = true,
}: UseVirtualizedReleaseGridOptions) => {
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const container = gridContainerRef.current;

    if (!container) {
      return undefined;
    }

    const updateColumnCount = () => {
      setColumnCount(
        getReleaseGridColumnCount(container.clientWidth, forceSingleColumn),
      );
    };

    updateColumnCount();

    const resizeObserver = new ResizeObserver(updateColumnCount);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [enabled, forceSingleColumn, gridContainerRef]);

  const rowCount = useMemo(
    () => (releaseCount > 0 ? Math.ceil(releaseCount / columnCount) : 0),
    [columnCount, releaseCount],
  );

  const rowEstimatePx = forceSingleColumn
    ? MOBILE_ROW_ESTIMATE_PX
    : DESKTOP_ROW_ESTIMATE_PX;

  const rowVirtualizer = useVirtualizer({
    count: enabled && scrollElement ? rowCount : 0,
    getScrollElement: () => scrollElement,
    estimateSize: () => rowEstimatePx,
    gap: GRID_GAP_PX,
    overscan: ROW_OVERSCAN,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  const useVirtualRows = enabled && scrollElement !== null && releaseCount > 0;

  return {
    columnCount,
    estimatedRowStride: rowEstimatePx + GRID_GAP_PX,
    initialFallbackRows: INITIAL_FALLBACK_ROWS,
    rowCount,
    rowVirtualizer,
    useVirtualRows,
    virtualRows: rowVirtualizer.getVirtualItems(),
  };
};
