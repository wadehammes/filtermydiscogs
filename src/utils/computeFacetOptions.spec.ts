import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { formatFactory } from "src/tests/factories/Format.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { computeFacetOptions } from "./computeFacetOptions";
import { buildReleaseSearchIndex } from "./releaseSearchIndex";

describe("computeFacetOptions", () => {
  it("returns facet values from one pass over the collection", () => {
    const releases = [
      releaseFactory.build({
        basic_information: basicInformationFactory.build({
          year: 2020,
          styles: ["Rock"],
          formats: [{ name: "Vinyl", qty: "1", descriptions: [] }],
        }),
      }),
      releaseFactory.build({
        basic_information: basicInformationFactory.build({
          year: 1990,
          styles: ["Jazz"],
          formats: [{ name: "CD", qty: "1", descriptions: [] }],
        }),
      }),
    ];

    buildReleaseSearchIndex(releases);

    const options = computeFacetOptions({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "",
      styleOperator: "OR",
      formatOperator: "OR",
      yearOperator: "OR",
    });

    expect(options.availableStyles).toEqual(["Jazz", "Rock"]);
    expect(options.availableYears).toEqual([2020, 1990]);
    expect(options.availableFormats).toEqual(["CD", "Vinyl"]);
  });

  const rockRelease = releaseFactory.build({
    basic_information: basicInformationFactory.build({
      styles: ["Rock"],
      year: 1980,
      formats: [formatFactory.build({ name: "Vinyl", descriptions: [] })],
    }),
  });

  const popRelease = releaseFactory.build({
    basic_information: basicInformationFactory.build({
      styles: ["Pop"],
      year: 2020,
      formats: [formatFactory.build({ name: "CD", descriptions: [] })],
    }),
  });

  const releases = [rockRelease, popRelease];

  it("excludes the styles dimension when computing year and format facets", () => {
    buildReleaseSearchIndex(releases);

    const options = computeFacetOptions({
      releases,
      selectedStyles: ["Rock"],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "",
      styleOperator: "OR",
      formatOperator: "OR",
      yearOperator: "OR",
    });

    expect(options.availableYears).toEqual([1980]);
    expect(options.availableFormats).toEqual(["Vinyl"]);
  });

  it("excludes the years dimension when computing style facets", () => {
    buildReleaseSearchIndex(releases);

    const options = computeFacetOptions({
      releases,
      selectedStyles: [],
      selectedYears: [2020],
      selectedFormats: [],
      searchQuery: "",
      styleOperator: "OR",
      formatOperator: "OR",
      yearOperator: "OR",
    });

    expect(options.availableStyles).toEqual(["Pop"]);
  });

  it("excludes the formats dimension when computing year facets", () => {
    buildReleaseSearchIndex(releases);

    const options = computeFacetOptions({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: ["Vinyl"],
      searchQuery: "",
      styleOperator: "OR",
      formatOperator: "OR",
      yearOperator: "OR",
    });

    expect(options.availableYears).toEqual([1980]);
  });
});
