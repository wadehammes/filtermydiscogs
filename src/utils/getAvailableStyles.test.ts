import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { getAvailableStyles } from "./getAvailableStyles";

describe("getAvailableStyles", () => {
  it("includes both genres and styles from the collection", () => {
    const releases = [
      releaseFactory.build({
        basic_information: basicInformationFactory.build({
          genres: ["Electronic"],
          styles: ["Techno"],
        }),
      }),
      releaseFactory.build({
        basic_information: basicInformationFactory.build({
          genres: ["Rock"],
          styles: ["Indie Rock"],
        }),
      }),
    ];

    expect(getAvailableStyles(releases)).toEqual([
      "Electronic",
      "Indie Rock",
      "Rock",
      "Techno",
    ]);
  });
});
