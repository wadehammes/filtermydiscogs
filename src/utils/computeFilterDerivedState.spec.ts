import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { computeFilterDerivedStateInputFrom } from "src/tests/factories/UserPreferences.factory";
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

    const result = computeFilterDerivedState(
      computeFilterDerivedStateInputFrom(releases, {
        searchQuery: "miles kind",
      }),
    );

    expect(result.filteredReleases).toEqual([matchingRelease]);
    expect(result.facetOptions.availableStyles).toEqual(["Jazz"]);
    expect(result.facetOptions.availableYears).toEqual([1959]);
    expect(result.facetOptions.availableFormats).toEqual(["Vinyl"]);
  });

  it("when excludedStyles is set, omits releases that carry any excluded tag", () => {
    const included = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Deep House"],
        year: 2018,
      }),
    });
    const alsoTaggedExcluded = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Deep House", "House"],
        year: 2018,
      }),
    });
    const releases = [included, alsoTaggedExcluded];

    buildReleaseSearchIndex(releases);

    const result = computeFilterDerivedState(
      computeFilterDerivedStateInputFrom(releases, {
        selectedStyles: ["Deep House"],
        excludedStyles: ["House"],
        selectedYears: [2018],
      }),
    );

    expect(result.filteredReleases).toEqual([included]);
  });

  it("when excludedFormats is set, omits releases that carry any excluded format tag", () => {
    const vinylOnly = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        formats: [{ name: "Vinyl", qty: "1" }],
        year: 2018,
      }),
    });
    const cdAndVinyl = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        formats: [
          { name: "CD", qty: "1" },
          { name: "Vinyl", qty: "1" },
        ],
        year: 2018,
      }),
    });
    const releases = [vinylOnly, cdAndVinyl];

    buildReleaseSearchIndex(releases);

    const result = computeFilterDerivedState(
      computeFilterDerivedStateInputFrom(releases, {
        selectedYears: [2018],
        selectedFormats: ["Vinyl"],
        excludedFormats: ["CD"],
      }),
    );

    expect(result.filteredReleases).toEqual([vinylOnly]);
  });

  it("when excludedYears is set, omits releases from excluded calendar years", () => {
    const y2018 = releaseFactory.build({
      basic_information: basicInformationFactory.build({ year: 2018 }),
    });
    const y2019 = releaseFactory.build({
      basic_information: basicInformationFactory.build({ year: 2019 }),
    });
    const releases = [y2018, y2019];

    buildReleaseSearchIndex(releases);

    const result = computeFilterDerivedState(
      computeFilterDerivedStateInputFrom(releases, {
        excludedYears: [2019],
      }),
    );

    expect(result.filteredReleases).toEqual([y2018]);
  });
});
