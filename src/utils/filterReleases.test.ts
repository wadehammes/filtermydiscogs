import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { clearSearchCache, filterReleases } from "./filterReleases";

describe("filterReleases", () => {
  beforeEach(() => {
    clearSearchCache();
  });

  it("returns all releases when no filters are applied", () => {
    const releases = releaseFactory.buildList(5);
    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
    });

    expect(result).toEqual(releases);
    expect(result).toHaveLength(5);
  });

  it("returns all releases when filters are empty arrays and no search query", () => {
    const releases = releaseFactory.buildList(3);
    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "",
    });

    expect(result).toEqual(releases);
  });

  it("filters by single style", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock"],
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Pop"],
      }),
    });
    const releases = [release1, release2];

    const result = filterReleases({
      releases,
      selectedStyles: ["Rock"],
      selectedYears: [],
      selectedFormats: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(release1);
  });

  it("filters by multiple styles", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock", "Alternative"],
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Pop"],
      }),
    });
    const release3 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Jazz"],
      }),
    });
    const releases = [release1, release2, release3];

    const result = filterReleases({
      releases,
      selectedStyles: ["Rock", "Jazz"],
      selectedYears: [],
      selectedFormats: [],
    });

    expect(result).toHaveLength(2);
    expect(result).toContainEqual(release1);
    expect(result).toContainEqual(release3);
  });

  it("returns empty array when no releases match style filter", () => {
    const releases = releaseFactory.buildList(3, {
      basic_information: basicInformationFactory.build({
        styles: ["Rock"],
      }),
    });

    const result = filterReleases({
      releases,
      selectedStyles: ["Jazz"],
      selectedYears: [],
      selectedFormats: [],
    });

    expect(result).toHaveLength(0);
  });

  it("filters with AND operator - requires all selected styles", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock", "Alternative"],
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock"],
      }),
    });
    const release3 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Alternative"],
      }),
    });
    const releases = [release1, release2, release3];

    const result = filterReleases({
      releases,
      selectedStyles: ["Rock", "Alternative"],
      selectedYears: [],
      selectedFormats: [],
      styleOperator: "AND",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(release1);
  });

  it("filters with NONE operator - excludes releases with any selected style", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock"],
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Jazz"],
      }),
    });
    const release3 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Pop"],
      }),
    });
    const release4 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock", "Jazz"],
      }),
    });
    const releases = [release1, release2, release3, release4];

    const result = filterReleases({
      releases,
      selectedStyles: ["Rock", "Jazz"],
      selectedYears: [],
      selectedFormats: [],
      styleOperator: "NONE",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(release3);
  });

  it("filters with NONE operator - excludes releases with single selected style", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock"],
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Pop"],
      }),
    });
    const release3 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Jazz"],
      }),
    });
    const releases = [release1, release2, release3];

    const result = filterReleases({
      releases,
      selectedStyles: ["Rock"],
      selectedYears: [],
      selectedFormats: [],
      styleOperator: "NONE",
    });

    expect(result).toHaveLength(2);
    expect(result).toContainEqual(release2);
    expect(result).toContainEqual(release3);
  });

  it("filters by single year", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        year: 2020,
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        year: 2021,
      }),
    });
    const releases = [release1, release2];

    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [2020],
      selectedFormats: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(release1);
  });

  it("filters by multiple years", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        year: 2020,
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        year: 2021,
      }),
    });
    const release3 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        year: 2022,
      }),
    });
    const releases = [release1, release2, release3];

    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [2020, 2022],
      selectedFormats: [],
    });

    expect(result).toHaveLength(2);
    expect(result).toContainEqual(release1);
    expect(result).toContainEqual(release3);
  });

  it("filters by single format", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        formats: [{ name: "LP" }],
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        formats: [{ name: "CD" }],
      }),
    });
    const releases = [release1, release2];

    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: ["LP"],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(release1);
  });

  it("filters by multiple formats", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        formats: [{ name: "LP" }],
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        formats: [{ name: "CD" }],
      }),
    });
    const release3 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        formats: [{ name: "Cassette" }],
      }),
    });
    const releases = [release1, release2, release3];

    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: ["LP", "Cassette"],
    });

    expect(result).toHaveLength(2);
    expect(result).toContainEqual(release1);
    expect(result).toContainEqual(release3);
  });

  it("filters by search query matching title", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        title: "Dark Side of the Moon",
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        title: "Abbey Road",
      }),
    });
    const releases = [release1, release2];

    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "dark",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(release1);
  });

  it("filters by search query matching artist", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        artists: [{ name: "Pink Floyd" }],
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        artists: [{ name: "The Beatles" }],
      }),
    });
    const releases = [release1, release2];

    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "pink",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(release1);
  });

  it("filters by search query matching label", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        labels: [{ name: "EMI Records" }],
        artists: [{ name: "Test Artist" }],
        title: "Test Title",
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        labels: [{ name: "Columbia Records" }],
        artists: [{ name: "Other Artist" }],
        title: "Other Title",
      }),
    });
    const releases = [release1, release2];

    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "emi",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(release1);
  });

  it("filters by search query matching catalog number", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        labels: [{ name: "Test Label", catno: "ABC-123" }],
        artists: [{ name: "Test Artist" }],
        title: "Test Title",
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        labels: [{ name: "Other Label", catno: "XYZ-456" }],
        artists: [{ name: "Other Artist" }],
        title: "Other Title",
      }),
    });
    const releases = [release1, release2];

    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "abc-123",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(release1);
  });

  it("search query is case insensitive", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        title: "Dark Side",
        artists: [{ name: "Pink Floyd" }],
      }),
    });
    const releases = [release1];

    const result1 = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "DARK",
    });
    const result2 = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "dark",
    });
    const result3 = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "DaRk",
    });

    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(1);
    expect(result3).toHaveLength(1);
  });

  it("search query matches partial strings", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        title: "Dark Side of the Moon",
      }),
    });
    const releases = [release1];

    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "dark side",
    });

    expect(result).toHaveLength(1);
  });

  it("ignores whitespace in search query", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        title: "Dark Side",
      }),
    });
    const releases = [release1];

    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "  dark  ",
    });

    expect(result).toHaveLength(1);
  });

  it("returns empty array when search query matches nothing", () => {
    const releases = releaseFactory.buildList(3, {
      basic_information: basicInformationFactory.build({
        title: "Test Release",
      }),
    });

    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "nonexistent",
    });

    expect(result).toHaveLength(0);
  });

  it("combines style and year filters", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock"],
        year: 2020,
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock"],
        year: 2021,
      }),
    });
    const release3 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Pop"],
        year: 2020,
      }),
    });
    const releases = [release1, release2, release3];

    const result = filterReleases({
      releases,
      selectedStyles: ["Rock"],
      selectedYears: [2020],
      selectedFormats: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(release1);
  });

  it("combines all filters", () => {
    const release1 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock"],
        year: 2020,
        formats: [{ name: "LP" }],
        title: "Test Album",
      }),
    });
    const release2 = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock"],
        year: 2020,
        formats: [{ name: "CD" }],
        title: "Different Album",
      }),
    });
    const releases = [release1, release2];

    const result = filterReleases({
      releases,
      selectedStyles: ["Rock"],
      selectedYears: [2020],
      selectedFormats: ["LP"],
      searchQuery: "test",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(release1);
  });

  it("uses search cache for repeated queries", () => {
    const release = releaseFactory.build({
      instance_id: "test-id",
      basic_information: basicInformationFactory.build({
        title: "Test Album",
      }),
    });
    const releases = [release];

    // First call should build cache
    const result1 = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "test",
    });
    expect(result1).toHaveLength(1);

    // Second call should use cache
    const result2 = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "test",
    });
    expect(result2).toHaveLength(1);
  });

  it("handles releases with multiple artists in search", () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        artists: [{ name: "Artist One" }, { name: "Artist Two" }],
      }),
    });
    const releases = [release];

    const result1 = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "artist one",
    });
    const result2 = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "artist two",
    });

    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(1);
  });

  it("handles releases with multiple labels in search", () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        labels: [{ name: "Label One" }, { name: "Label Two" }],
      }),
    });
    const releases = [release];

    const result1 = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "label one",
    });
    const result2 = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "label two",
    });

    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(1);
  });

  it("handles empty releases array", () => {
    const result = filterReleases({
      releases: [],
      selectedStyles: ["Rock"],
      selectedYears: [2020],
      selectedFormats: ["LP"],
      searchQuery: "test",
    });

    expect(result).toHaveLength(0);
  });
});

describe("clearSearchCache", () => {
  it("clears the search cache", () => {
    const release = releaseFactory.build({
      instance_id: "test-id",
      basic_information: basicInformationFactory.build({
        title: "Test Album",
      }),
    });
    const releases = [release];

    // Build cache
    filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "test",
    });
    expect(
      filterReleases({
        releases,
        selectedStyles: [],
        selectedYears: [],
        selectedFormats: [],
        searchQuery: "test",
      }),
    ).toHaveLength(1);

    // Clear cache
    clearSearchCache();

    // Cache should be cleared (functionality should still work)
    const result = filterReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "test",
    });
    expect(result).toHaveLength(1);
  });
});
