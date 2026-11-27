export const MOSAIC_VISIBLE_TILE_OVERSCAN_ROWS = 2;

export type MosaicVisibleTileRangeInput = {
  scrollTop: number;
  viewportHeight: number;
  cellSize: number;
  cols: number;
  itemCount: number;
  overscanRows?: number;
};

export const listMosaicVisibleTileIndices = ({
  scrollTop,
  viewportHeight,
  cellSize,
  cols,
  itemCount,
  overscanRows = MOSAIC_VISIBLE_TILE_OVERSCAN_ROWS,
}: MosaicVisibleTileRangeInput): number[] => {
  if (itemCount <= 0 || cols <= 0 || cellSize <= 0) {
    return [];
  }

  const rowCount = Math.ceil(itemCount / cols);
  const startRow = Math.max(0, Math.floor(scrollTop / cellSize) - overscanRows);
  const endRow = Math.min(
    rowCount - 1,
    Math.ceil((scrollTop + viewportHeight) / cellSize) - 1 + overscanRows,
  );

  const indices: number[] = [];
  for (let row = startRow; row <= endRow; row++) {
    const rowStartIndex = row * cols;
    const rowEndIndex = Math.min(rowStartIndex + cols - 1, itemCount - 1);
    for (let index = rowStartIndex; index <= rowEndIndex; index++) {
      indices.push(index);
    }
  }

  return indices;
};
