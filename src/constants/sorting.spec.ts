import { describe, expect, it } from "@jest/globals";
import {
  isThenByCompatibleWithPrimary,
  normalizeThenBySortSelection,
  SORTING_OPTIONS,
  SORTING_SECONDARY_OPTIONS,
} from "src/constants/sorting";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";

describe("sorting constants", () => {
  it("defines a compact shortName for every primary sort option", () => {
    for (const option of SORTING_OPTIONS) {
      expect(option.shortName.length).toBeGreaterThan(0);
      expect(option.shortName.length).toBeLessThanOrEqual(option.name.length);
    }
  });

  it("uses Date Added on compact date sort labels", () => {
    expect(
      SORTING_OPTIONS.find((option) => option.value === SortValues.DateAddedNew)
        ?.shortName,
    ).toBe("Date Added ↓");
    expect(
      SORTING_OPTIONS.find((option) => option.value === SortValues.DateAddedOld)
        ?.shortName,
    ).toBe("Date Added ↑");
  });

  it("uses Release Year on compact release year sort labels", () => {
    expect(
      SORTING_OPTIONS.find((option) => option.value === SortValues.AlbumYearNew)
        ?.shortName,
    ).toBe("Release Year ↓");
    expect(
      SORTING_OPTIONS.find((option) => option.value === SortValues.AlbumYearOld)
        ?.shortName,
    ).toBe("Release Year ↑");
  });

  it("uses single-line summary names without comma clause breaks", () => {
    for (const option of [...SORTING_OPTIONS, ...SORTING_SECONDARY_OPTIONS]) {
      expect(option.name).not.toMatch(/,\s/);
    }
  });

  it("splits sort menu copy into field plus order without em dashes", () => {
    const dateAddedOld = SORTING_OPTIONS.find(
      (option) => option.value === SortValues.DateAddedOld,
    );

    expect(dateAddedOld?.menuField).toBe("Date Added");
    expect(dateAddedOld?.menuOrder).toBe("oldest");
    expect(dateAddedOld?.menuField).not.toContain("—");

    const artistZa = SORTING_OPTIONS.find(
      (option) => option.value === SortValues.ZAArtist,
    );

    expect(artistZa?.menuField).toBe("Artist");
    expect(artistZa?.menuOrder).toBe("Z–A");
  });

  it("includes None plus primary options in secondary sort choices", () => {
    expect(SORTING_SECONDARY_OPTIONS[0]?.value).toBe(SortSecondaryValues.None);
    expect(SORTING_SECONDARY_OPTIONS).toHaveLength(SORTING_OPTIONS.length + 1);
  });

  it("treats opposite directions on the same field as incompatible Then by choices", () => {
    expect(
      isThenByCompatibleWithPrimary(
        SortValues.DateAddedNew,
        SortValues.DateAddedOld,
      ),
    ).toBe(false);
    expect(
      isThenByCompatibleWithPrimary(
        SortValues.RatingHigh,
        SortValues.RatingLow,
      ),
    ).toBe(false);
    expect(
      isThenByCompatibleWithPrimary(
        SortValues.AZArtist,
        SortValues.DateAddedNew,
      ),
    ).toBe(true);
  });

  it("normalizes incompatible Then by selections to None", () => {
    expect(
      normalizeThenBySortSelection(
        SortValues.DateAddedNew,
        SortValues.DateAddedOld,
      ),
    ).toBe(SortSecondaryValues.None);
    expect(
      normalizeThenBySortSelection(
        SortValues.AZArtist,
        SortValues.DateAddedOld,
      ),
    ).toBe(SortValues.DateAddedOld);
  });
});
