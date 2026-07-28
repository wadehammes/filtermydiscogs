import { beforeEach, describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { formatFactory } from "src/tests/factories/Format.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { getFacetSourceReleases } from "./getFacetSourceReleases";

describe("getFacetSourceReleases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const rockRelease = releaseFactory.build({
    basic_information: basicInformationFactory.build({
      styles: ["Rock"],
      year: 1980,
      formats: [formatFactory.build({ name: "Vinyl" })],
    }),
  });

  const popRelease = releaseFactory.build({
    basic_information: basicInformationFactory.build({
      styles: ["Pop"],
      year: 2020,
      formats: [formatFactory.build({ name: "CD" })],
    }),
  });

  const releases = [rockRelease, popRelease];

  it("excludes the styles dimension when computing year and format facets", () => {
    const facetReleases = getFacetSourceReleases({
      releases,
      selectedStyles: ["Rock"],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "",
      styleOperator: "OR",
      excludeDimension: "years",
    });

    expect(facetReleases).toEqual([rockRelease]);
  });

  it("excludes the years dimension when computing style facets", () => {
    const facetReleases = getFacetSourceReleases({
      releases,
      selectedStyles: [],
      selectedYears: [2020],
      selectedFormats: [],
      searchQuery: "",
      styleOperator: "OR",
      excludeDimension: "styles",
    });

    expect(facetReleases).toEqual([popRelease]);
  });

  it("excludes the formats dimension when computing year facets", () => {
    const facetReleases = getFacetSourceReleases({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: ["Vinyl"],
      searchQuery: "",
      styleOperator: "OR",
      excludeDimension: "years",
    });

    expect(facetReleases).toEqual([rockRelease]);
  });
});
