// Mosaic generation constants
export const MOSAIC_CONSTANTS = {
  // Canvas settings
  CANVAS_CELL_SIZE: 150,
  CANVAS_BACKGROUND_COLOR: "#000000",

  // Image loading
  IMAGE_LOAD_TIMEOUT: 3000,
  BATCH_SIZE: 5,
  BATCH_DELAY: 100,

  // Grid calculations
  CONTAINER_PADDING: 16,
  MAX_CONTAINER_WIDTH: 1400,
  CONTAINER_WIDTH_RATIO: 0.95,

  // Cell size ranges
  SMALL_COLLECTION_MAX: 50,
  MEDIUM_COLLECTION_MAX: 200,
  MIN_CELL_SIZE: 60,
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
