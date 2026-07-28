import { beforeEach, describe, expect, it } from "@jest/globals";
import { StickyHeaderBarPageObject } from "src/components/StickyHeaderBar/StickyHeaderBar.po";
import { screen } from "test-utils";

let po: StickyHeaderBarPageObject;

describe("StickyHeaderBar", () => {
  beforeEach(() => {
    po = new StickyHeaderBarPageObject();
  });

  it("renders the desktop filters bar when the collection is ready", () => {
    po.renderStickyHeaderBar();

    expect(screen.getByTestId(po.searchBarTestId)).toBeInTheDocument();
    expect(
      screen.queryByTestId(po.filtersSkeletonTestId),
    ).not.toBeInTheDocument();
  });

  it("renders the filters skeleton while releases are still loading", () => {
    po.renderStickyHeaderBar({ allReleasesLoaded: false });

    expect(screen.getByTestId(po.filtersSkeletonTestId)).toBeInTheDocument();
    expect(screen.queryByTestId(po.searchBarTestId)).not.toBeInTheDocument();
  });

  it("hides filters when hideFilters is true", () => {
    po.renderStickyHeaderBar({ hideFilters: true });

    expect(screen.queryByTestId(po.searchBarTestId)).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(po.filtersSkeletonTestId),
    ).not.toBeInTheDocument();
  });
});
