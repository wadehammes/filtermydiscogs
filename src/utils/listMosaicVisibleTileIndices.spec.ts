import { describe, expect, it } from "@jest/globals";
import { listMosaicVisibleTileIndices } from "src/utils/listMosaicVisibleTileIndices";

describe("listMosaicVisibleTileIndices", () => {
  it("returns indices for rows intersecting the scroll viewport", () => {
    const indices = listMosaicVisibleTileIndices({
      scrollTop: 100,
      viewportHeight: 80,
      cellSize: 40,
      cols: 4,
      itemCount: 40,
      overscanRows: 1,
    });

    expect(indices).toEqual([
      4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    ]);
  });

  it("returns an empty list when the grid has no items", () => {
    expect(
      listMosaicVisibleTileIndices({
        scrollTop: 0,
        viewportHeight: 400,
        cellSize: 40,
        cols: 5,
        itemCount: 0,
      }),
    ).toEqual([]);
  });
});
