import { beforeEach, describe, expect, it } from "@jest/globals";
import { CollectionSortControlsPageObject } from "src/components/CollectionSortControls/CollectionSortControls.po";
import { SortValues } from "src/constants/sortValues";
import { getThenBySortSelectOptions } from "src/utils/collectionSortOptions";
import { screen } from "test-utils";

let po: CollectionSortControlsPageObject;

describe("CollectionSortControls", () => {
  beforeEach(() => {
    po = new CollectionSortControlsPageObject();
  });

  it("renders CollectionSortControls", () => {
    po.renderCollectionSortControls();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("shows a join divider between Sort by and Then by", () => {
    po.renderCollectionSortControls();

    expect(screen.getByTestId("fmdCollectionSortJoin")).toBeInTheDocument();
  });

  it("excludes the active primary sort from Then by select options", () => {
    po.renderCollectionSortControls({
      primarySort: SortValues.AZArtist,
    });

    const thenByValues = getThenBySortSelectOptions(SortValues.AZArtist).map(
      (option) => option.value,
    );

    expect(thenByValues).not.toContain(SortValues.AZArtist);
  });

  it("excludes every sort on the same field as primary from Then by options", () => {
    po.renderCollectionSortControls({
      primarySort: SortValues.DateAddedNew,
    });

    const thenByValues = getThenBySortSelectOptions(
      SortValues.DateAddedNew,
    ).map((option) => option.value);

    expect(thenByValues).not.toContain(SortValues.DateAddedNew);
    expect(thenByValues).not.toContain(SortValues.DateAddedOld);
    expect(thenByValues).toContain(SortValues.AZArtist);
  });

  it("shows compact labels on closed sort triggers", () => {
    po.renderCollectionSortControls({
      primarySort: SortValues.DateAddedOld,
      secondarySort: SortValues.AZArtist,
    });

    expect(screen.getByText("Date Added ↑")).toBeInTheDocument();
    expect(screen.getByText("Artist A–Z")).toBeInTheDocument();
    expect(screen.queryByText("oldest")).not.toBeInTheDocument();
  });
});
