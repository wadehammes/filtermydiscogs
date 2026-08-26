import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { computeFilterDerivedState } from "./computeFilterDerivedState";
import { buildReleaseSearchIndex } from "./releaseSearchIndex";

describe("computeFilterDerivedState", () => {
  it("returns filtered releases and facet options from one pass", () => {
    const matchingRelease = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        title: "Kind of Blue",
        artists: [{ name: "Miles Davis" }],
        year: 1959,
        styles: ["Jazz"],
        formats: [{ name: "Vinyl", qty: "1", descriptions: [] }],
      }),
    });
    const otherRelease = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        title: "Rock Album",
        artists: [{ name: "The Strokes" }],
        styles: ["Rock"],
        year: 2020,
        formats: [{ name: "CD", qty: "1", descriptions: [] }],
      }),
    });
    const releases = [matchingRelease, otherRelease];

    buildReleaseSearchIndex(releases);

    const result = computeFilterDerivedState({
      releases,
      selectedStyles: [],
      selectedYears: [],
      selectedFormats: [],
      searchQuery: "miles kind",
      styleOperator: "OR",
      formatOperator: "OR",
      yearOperator: "OR",
    });

    expect(result.filteredReleases).toEqual([matchingRelease]);
    expect(result.facetOptions.availableStyles).toEqual(["Jazz"]);
    expect(result.facetOptions.availableYears).toEqual([1959]);
    expect(result.facetOptions.availableFormats).toEqual(["Vinyl"]);
  });
});
