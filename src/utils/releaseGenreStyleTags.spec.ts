import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { getReleaseGenreStyleTags } from "./releaseGenreStyleTags";

describe("getReleaseGenreStyleTags", () => {
  it("returns genres before styles and dedupes overlapping values", () => {
    const tags = getReleaseGenreStyleTags(
      basicInformationFactory.build({
        genres: ["Rock", "Electronic"],
        styles: ["Rock", "Shoegaze"],
      }),
    );

    expect(tags).toEqual(["Rock", "Electronic", "Shoegaze"]);
  });

  it("ignores empty genre and style strings", () => {
    const tags = getReleaseGenreStyleTags(
      basicInformationFactory.build({
        genres: ["", " Jazz "],
        styles: ["", "Blues"],
      }),
    );

    expect(tags).toEqual(["Jazz", "Blues"]);
  });
});
