import { describe, expect, it } from "@jest/globals";
import { formatFactory } from "src/tests/factories/Format.factory";
import {
  getFormatSubtypeTags,
  getFormatTagsFromFormat,
  getReleaseFormatTags,
  sortFormatTags,
} from "./formatFilterTags";

describe("formatFilterTags", () => {
  it("returns only filterable subtype descriptions", () => {
    const format = {
      name: "Vinyl",
      descriptions: ["LP", '12"', "Album", "Stereo", "Remastered"],
    };

    expect(getFormatSubtypeTags(format).sort()).toEqual(['12"', "LP"].sort());
  });

  it("includes any non-denylisted description without an allowlist entry", () => {
    const format = {
      name: "Vinyl",
      descriptions: ['12"', "Regional Pressing", "Album"],
    };

    expect(getFormatSubtypeTags(format).sort()).toEqual(
      ['12"', "Regional Pressing"].sort(),
    );
  });

  it("includes collector format descriptions such as test pressings and white labels", () => {
    const format = {
      name: "Vinyl",
      descriptions: ['12"', "Test Pressing", "White Label", "Album"],
    };

    expect(getFormatSubtypeTags(format).sort()).toEqual(
      ['12"', "Test Pressing", "White Label"].sort(),
    );
  });

  it("includes hand-stamped format descriptions", () => {
    const format = {
      name: "Vinyl",
      descriptions: ['12"', "Hand-stamped", "Album"],
    };

    expect(getFormatSubtypeTags(format).sort()).toEqual(
      ['12"', "Hand-stamped"].sort(),
    );
  });

  it("canonicalizes format description casing to a single tag", () => {
    const tags = getReleaseFormatTags([
      {
        name: "Vinyl",
        descriptions: ["test pressing", "LP"],
      },
      {
        name: "vinyl",
        descriptions: ["Test Pressing"],
      },
    ]);

    expect(tags).toEqual(["LP", "Test Pressing", "Vinyl"]);
  });

  it("includes format name and physical size descriptions", () => {
    const format = {
      name: "Vinyl",
      descriptions: ["LP", '12"', "Album", "Stereo"],
    };

    expect(getFormatTagsFromFormat(format).sort()).toEqual(
      ['12"', "LP", "Vinyl"].sort(),
    );
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

  it("sorts format tags alphabetically", () => {
    expect(sortFormatTags(["CD", '7"', "Vinyl", '12"'])).toEqual([
      '12"',
      '7"',
      "CD",
      "Vinyl",
    ]);
  });
});
