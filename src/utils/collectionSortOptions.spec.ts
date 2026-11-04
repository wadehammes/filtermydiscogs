import { describe, expect, it } from "@jest/globals";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import {
  getPrimarySortSelectOptions,
  getThenBySortSelectOptions,
  normalizeThenBySortSelection,
} from "src/utils/collectionSortOptions";

describe("collectionSortOptions", () => {
  it("omits the active primary sort from Then by options", () => {
    const values = getThenBySortSelectOptions(SortValues.AZArtist).map(
      (option) => option.value,
    );

    expect(values).toContain(SortSecondaryValues.None);
    expect(values).not.toContain(SortValues.AZArtist);
    expect(values).toContain(SortValues.DateAddedOld);
  });

  it("omits every sort on the same field as the primary from Then by options", () => {
    const values = getThenBySortSelectOptions(SortValues.DateAddedNew).map(
      (option) => option.value,
    );

    expect(values).not.toContain(SortValues.DateAddedNew);
    expect(values).not.toContain(SortValues.DateAddedOld);
    expect(values).toContain(SortValues.AlbumYearNew);
  });

  it("maps menu field and order for split sort menu rows", () => {
    const primaryOptions = getPrimarySortSelectOptions();

    expect(primaryOptions[0]?.menuField).toBe("Date Added");
    expect(primaryOptions[0]?.menuOrder).toBe("newest");
    expect(primaryOptions[0]?.label).toBe("Date Added newest");
    expect(primaryOptions[2]?.menuField).toBe("Release Year");
  });

  it("separates sort menu groups with a leading divider", () => {
    const primaryOptions = getPrimarySortSelectOptions();

    expect(primaryOptions[0]?.separatorBefore).toBe(false);
    expect(primaryOptions[2]?.separatorBefore).toBe(true);
    expect(primaryOptions[6]?.separatorBefore).toBe(true);
  });

  it("separates None from sort choices in Then by options", () => {
    const thenByOptions = getThenBySortSelectOptions(SortValues.AZArtist);

    expect(thenByOptions[0]?.label).toBe("None");
    expect(thenByOptions[1]?.separatorBefore).toBe(true);
  });

  it("normalizes Then by to None when it matches the primary sort", () => {
    expect(
      normalizeThenBySortSelection(SortValues.AZArtist, SortValues.AZArtist),
    ).toBe(SortSecondaryValues.None);
    expect(
      normalizeThenBySortSelection(
        SortValues.AZArtist,
        SortValues.DateAddedNew,
      ),
    ).toBe(SortValues.DateAddedNew);
  });

  it("normalizes Then by to None when it is the opposite direction on the same field", () => {
    expect(
      normalizeThenBySortSelection(
        SortValues.DateAddedNew,
        SortValues.DateAddedOld,
      ),
    ).toBe(SortSecondaryValues.None);
    expect(
      normalizeThenBySortSelection(SortValues.RatingHigh, SortValues.RatingLow),
    ).toBe(SortSecondaryValues.None);
  });
});
