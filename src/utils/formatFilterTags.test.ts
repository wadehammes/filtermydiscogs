import { formatFactory } from "src/tests/factories/Format.factory";
import {
  getFormatSubtypeTags,
  getFormatTagsFromFormat,
  getReleaseFormatTags,
  releaseMatchesFormatFilters,
  sortFormatTags,
} from "./formatFilterTags";

describe("formatFilterTags", () => {
  it("returns only filterable subtype descriptions", () => {
    const format = {
      name: "Vinyl",
      descriptions: ["LP", '12"', "Album", "Stereo"],
    };

    expect(getFormatSubtypeTags(format)).toEqual(['12"', "LP"]);
  });

  it("includes format name and physical size descriptions", () => {
    const format = {
      name: "Vinyl",
      descriptions: ["LP", '12"', "Album", "Stereo"],
    };

    expect(getFormatTagsFromFormat(format)).toEqual(["Vinyl", '12"', "LP"]);
  });

  it("includes cassette and cd names", () => {
    const format = formatFactory.build({
      name: "Cassette",
      descriptions: ["Album"],
    });

    expect(getFormatTagsFromFormat(format)).toEqual(["Cassette"]);
  });

  it("deduplicates tags across multiple format entries", () => {
    const tags = getReleaseFormatTags([
      formatFactory.build({
        name: "Vinyl",
        descriptions: ['12"', "LP"],
      }),
      formatFactory.build({
        name: "Vinyl",
        descriptions: ["LP"],
      }),
    ]);

    expect(tags).toEqual(['12"', "LP", "Vinyl"]);
  });

  it("matches selected physical format tags", () => {
    const formats = [
      formatFactory.build({
        name: "Vinyl",
        descriptions: ['7"', "Single"],
      }),
    ];

    expect(releaseMatchesFormatFilters(formats, ['7"'])).toBe(true);
    expect(releaseMatchesFormatFilters(formats, ['12"'])).toBe(false);
    expect(releaseMatchesFormatFilters(formats, ["Cassette"])).toBe(false);
  });

  it("sorts common format tags in a predictable order", () => {
    expect(sortFormatTags(["CD", '7"', "Vinyl", '12"'])).toEqual([
      '12"',
      '7"',
      "Vinyl",
      "CD",
    ]);
  });
});
