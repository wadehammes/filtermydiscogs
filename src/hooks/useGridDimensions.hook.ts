import { useCallback, useEffect, useState } from "react";
import { GRID_BREAKPOINTS, MOSAIC_CONSTANTS } from "src/constants/mosaic";

export interface GridDimensions {
  cols: number;
  rows: number;
  cellSize: number;
}

interface UseGridDimensionsOptions {
  itemCount: number;
  debounceMs?: number;
}

export function useGridDimensions({
  itemCount,
  debounceMs = 100,
}: UseGridDimensionsOptions) {
  const calculateGridDimensions = useCallback(
    (count: number): GridDimensions => {
      if (count === 0) return { cols: 0, rows: 0, cellSize: 0 };

      // Calculate responsive cell size based on container width
      const containerWidth =
        typeof window !== "undefined" ? window.innerWidth : 1200;
      const availableWidth = Math.min(
        containerWidth * MOSAIC_CONSTANTS.CONTAINER_WIDTH_RATIO,
        MOSAIC_CONSTANTS.MAX_CONTAINER_WIDTH,
      );
      const padding = MOSAIC_CONSTANTS.CONTAINER_PADDING;
      const _gap = 0; // No gap for seamless mosaic

      // Dynamic cell size based on number of releases
      // Fewer releases = bigger cells, more releases = smaller cells
      let targetCellSize: number;
      if (count <= GRID_BREAKPOINTS.SMALL.MAX_ITEMS) {
        targetCellSize = GRID_BREAKPOINTS.SMALL.CALCULATION(count);
      } else if (count <= GRID_BREAKPOINTS.MEDIUM.MAX_ITEMS) {
        targetCellSize = GRID_BREAKPOINTS.MEDIUM.CALCULATION(count);
      } else {
        targetCellSize = GRID_BREAKPOINTS.LARGE.CALCULATION(count);
      }

      const cols = Math.floor((availableWidth - padding) / targetCellSize);
      const rows = Math.ceil(count / cols);

      // Adjust cell size to fit available width
      const actualCellSize = Math.floor((availableWidth - padding) / cols);

      return {
        cols: Math.max(1, cols),
        rows,
        cellSize: Math.max(
          MOSAIC_CONSTANTS.MIN_CELL_SIZE,
          Math.min(MOSAIC_CONSTANTS.MAX_CELL_SIZE, actualCellSize),
        ),
      };
    },
    [],
  );

  const [gridDimensions, setGridDimensions] = useState<GridDimensions>(() =>
    calculateGridDimensions(itemCount),
  );

  // Update grid dimensions on window resize
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const updateGridDimensions = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setGridDimensions(calculateGridDimensions(itemCount));
      }, debounceMs);
    };

    // Initial calculation
    updateGridDimensions();

    // Add resize listener
    window.addEventListener("resize", updateGridDimensions);

    return () => {
      window.removeEventListener("resize", updateGridDimensions);
      clearTimeout(timeoutId);
    };
  }, [itemCount, calculateGridDimensions, debounceMs]);

  return gridDimensions;
}
