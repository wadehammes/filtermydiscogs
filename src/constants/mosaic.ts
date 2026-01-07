// Mosaic generation constants
export const MOSAIC_CONSTANTS = {
  // Canvas settings
  CANVAS_CELL_SIZE: 150,
  CANVAS_BACKGROUND_COLOR: "#000000",

  // Image loading
  IMAGE_LOAD_TIMEOUT: 3000,
  BATCH_SIZE: 5,
  BATCH_DELAY: 100,

  // Performance monitoring
  LARGE_COLLECTION_THRESHOLD: 1000,
  PERFORMANCE_WARNING_THRESHOLD: 500,
  MAX_RECOMMENDED_COLLECTION_SIZE: 2000,

  // Aspect ratio options
  ASPECT_RATIOS: {
    SQUARE: { width: 1, height: 1, name: "Square" },
    LANDSCAPE: { width: 16, height: 9, name: "Landscape (16:9)" },
    PORTRAIT: { width: 3, height: 4, name: "Portrait (3:4)" },
  } as const,

  // Canvas size constraints
  MIN_CANVAS_SIZE: 400,
  MAX_CANVAS_SIZE: 4000,
  PREFERRED_CANVAS_SIZE: 1200,
  FIXED_SQUARE_CANVAS_SIZE: 1000,
  FIXED_LANDSCAPE_CANVAS_SIZE: 1600,
  FIXED_PORTRAIT_CANVAS_SIZE: 1200,

  // Grid calculations
  CONTAINER_PADDING: 16,
  MAX_CONTAINER_WIDTH: 1400,
  CONTAINER_WIDTH_RATIO: 0.95,

  // Cell size ranges
  SMALL_COLLECTION_MAX: 50,
  MEDIUM_COLLECTION_MAX: 200,
  MIN_CELL_SIZE: 10, // Reduced to allow smaller thumbs for large collections
  MAX_CELL_SIZE: 250,

  // Quality settings
  MIN_QUALITY: 60,
  MAX_QUALITY: 95,
  DEFAULT_QUALITY: 85,

  // Format settings
  DEFAULT_FORMAT: "jpeg" as const,

  // Placeholder settings
  PLACEHOLDER_COLOR: "#f0f0f0",
  PLACEHOLDER_BORDER_COLOR: "#cccccc",
  PLACEHOLDER_TEXT_COLOR: "#999999",
  PLACEHOLDER_SYMBOL: "♪",
  PLACEHOLDER_FONT_RATIO: 0.3,
} as const;

// Grid calculation breakpoints
export const GRID_BREAKPOINTS = {
  SMALL: {
    MAX_ITEMS: 50,
    CELL_SIZE_RANGE: { MIN: 120, MAX: 250 },
    CALCULATION: (count: number) =>
      Math.min(250, Math.max(120, 300 - count * 2)),
  },
  MEDIUM: {
    MAX_ITEMS: 200,
    CELL_SIZE_RANGE: { MIN: 80, MAX: 120 },
    CALCULATION: (count: number) =>
      Math.min(120, Math.max(80, 150 - count * 0.3)),
  },
  LARGE: {
    CELL_SIZE_RANGE: { MIN: 60, MAX: 80 },
    CALCULATION: (count: number) =>
      Math.min(80, Math.max(60, 100 - count * 0.1)),
  },
} as const;

// Image proxy URL parameters
export const IMAGE_PROXY_PARAMS = {
  WIDTH: "w",
  HEIGHT: "h",
  QUALITY: "q",
  FORMAT: "f",
} as const;

// Calculate optimal grid dimensions for a given aspect ratio and item count
export function calculateOptimalGrid(
  itemCount: number,
  aspectRatio: { width: number; height: number },
): {
  cols: number;
  rows: number;
  cellSize: number;
  canvasWidth: number;
  canvasHeight: number;
} {
  if (itemCount === 0) {
    return { cols: 0, rows: 0, cellSize: 0, canvasWidth: 0, canvasHeight: 0 };
  }

  const { width: aspectWidth, height: aspectHeight } = aspectRatio;
  const aspectRatioValue = aspectWidth / aspectHeight;

  // Use fixed canvas sizes for all aspect ratios to ensure all items fit
  let fixedCanvasWidth: number;
  let fixedCanvasHeight: number;

  if (aspectRatioValue === 1) {
    // Square: 1000x1000
    fixedCanvasWidth = MOSAIC_CONSTANTS.FIXED_SQUARE_CANVAS_SIZE;
    fixedCanvasHeight = MOSAIC_CONSTANTS.FIXED_SQUARE_CANVAS_SIZE;
  } else if (aspectRatioValue > 1) {
    // Landscape: 1600x900 (16:9)
    fixedCanvasWidth = MOSAIC_CONSTANTS.FIXED_LANDSCAPE_CANVAS_SIZE;
    fixedCanvasHeight = Math.floor(
      MOSAIC_CONSTANTS.FIXED_LANDSCAPE_CANVAS_SIZE / aspectRatioValue,
    );
  } else {
    // Portrait: 900x1200 (3:4)
    fixedCanvasHeight = MOSAIC_CONSTANTS.FIXED_PORTRAIT_CANVAS_SIZE;
    fixedCanvasWidth = Math.floor(
      MOSAIC_CONSTANTS.FIXED_PORTRAIT_CANVAS_SIZE * aspectRatioValue,
    );
  }

  // Calculate grid dimensions that best fit the aspect ratio
  let bestCols = 1;
  let bestScore = Infinity;

  // Try different column counts to find the best fit for the aspect ratio
  for (let cols = 1; cols <= itemCount; cols++) {
    const rows = Math.ceil(itemCount / cols);
    const gridAspectRatio = cols / rows;
    const aspectRatioDiff = Math.abs(gridAspectRatio - aspectRatioValue);

    // Prefer grids that are closer to the target aspect ratio
    if (aspectRatioDiff < bestScore) {
      bestScore = aspectRatioDiff;
      bestCols = cols;
    }
  }

  // Calculate cell size to fill the entire canvas without gaps
  // For square: if we have 1000 items, we need 32x32 grid (1024 cells)
  // Each cell should be: 1000px / 32 = ~31px

  // Calculate the optimal grid that fits the aspect ratio
  const finalCols = bestCols;
  const finalRows = Math.ceil(itemCount / finalCols);

  // Calculate cell size to perfectly fill the canvas width (no gaps on right side)
  // Prioritize filling the width to avoid the black bar issue
  const cellSizeByWidth = fixedCanvasWidth / finalCols;
  const cellSizeByHeight = fixedCanvasHeight / finalRows;

  // Use the width-based cell size to ensure we fill the entire canvas width
  // This prevents the black bar on the right side
  let finalCellSize = cellSizeByWidth;

  // If using width-based size would exceed the canvas height, use height-based instead
  if (finalRows * finalCellSize > fixedCanvasHeight) {
    finalCellSize = cellSizeByHeight;
  }

  // Ensure we don't go below minimum cell size unless absolutely necessary
  finalCellSize = Math.max(MOSAIC_CONSTANTS.MIN_CELL_SIZE, finalCellSize);

  // Recalculate canvas dimensions to exactly match the grid (no gaps)
  // This ensures the grid fills the entire canvas without black bars
  const actualCanvasWidth = finalCols * finalCellSize;
  const actualCanvasHeight = finalRows * finalCellSize;

  return {
    cols: finalCols,
    rows: finalRows,
    cellSize: finalCellSize,
    canvasWidth: actualCanvasWidth,
    canvasHeight: actualCanvasHeight,
  };
}
