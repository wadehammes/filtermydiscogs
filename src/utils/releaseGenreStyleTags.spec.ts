import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { getReleaseGenreStyleTags } from "./releaseGenreStyleTags";

describe("getReleaseGenreStyleTags", () => {
  it("returns deduped genre and style tags sorted A-Z", () => {
    const tags = getReleaseGenreStyleTags(
      basicInformationFactory.build({
        genres: ["Rock", "Electronic"],
        styles: ["Rock", "Shoegaze"],
      }),
    );

    expect(tags).toEqual(["Electronic", "Rock", "Shoegaze"]);
  });

  it("ignores empty genre and style strings", () => {
    const tags = getReleaseGenreStyleTags(
      basicInformationFactory.build({
        genres: ["", " Jazz "],
        styles: ["", "Blues"],
      }),
    );

    expect(tags).toEqual(["Blues", "Jazz"]);
  });
});
