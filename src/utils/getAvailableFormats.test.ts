import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { getAvailableFormats } from "./getAvailableFormats";

describe("getAvailableFormats", () => {
  it("collects format tags from names and descriptions", () => {
    const releases = [
      releaseFactory.build({
        basic_information: basicInformationFactory.build({
          formats: [{ name: "Vinyl", descriptions: ['12"', "LP"] }],
        }),
      }),
      releaseFactory.build({
        basic_information: basicInformationFactory.build({
          formats: [{ name: "Cassette", descriptions: ["Album"] }],
        }),
      }),
    ];

    expect(getAvailableFormats(releases)).toEqual([
      '12"',
      "LP",
      "Vinyl",
      "Cassette",
    ]);
  });

  it("deduplicates format tags across releases", () => {
    const releases = releaseFactory.buildList(2, {
      basic_information: basicInformationFactory.build({
        formats: [{ name: "Vinyl", descriptions: ['7"'] }],
      }),
    });

    expect(getAvailableFormats(releases)).toEqual(['7"', "Vinyl"]);
  });
});
