import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { formatFactory } from "src/tests/factories/Format.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  releaseMatchesFormats,
  releaseMatchesYear,
} from "./releaseFilterMatchers";

const releaseWithFormats = (
  formats: ReturnType<typeof formatFactory.build>[],
) =>
  releaseFactory.build({
    basic_information: basicInformationFactory.build({ formats }),
  });

describe("releaseMatchesYear", () => {
  it("matches any selected year with OR operator", () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({ year: 2020 }),
    });

    expect(releaseMatchesYear(release, [2020], "OR")).toBe(true);
    expect(releaseMatchesYear(release, [2021], "OR")).toBe(false);
    expect(releaseMatchesYear(release, [2020, 2021], "OR")).toBe(true);
  });

  it("excludes releases from selected years with NONE operator", () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({ year: 2020 }),
    });

    expect(releaseMatchesYear(release, [2020], "NONE")).toBe(false);
    expect(releaseMatchesYear(release, [2021], "NONE")).toBe(true);
    expect(releaseMatchesYear(release, [2020, 2021], "NONE")).toBe(false);
  });
});

describe("releaseMatchesFormats", () => {
  it("matches selected physical format tags", () => {
    const release = releaseWithFormats([
      formatFactory.build({
        name: "Vinyl",
        descriptions: ['7"', "Single"],
      }),
    ]);

    expect(releaseMatchesFormats(release, ['7"'], "OR")).toBe(true);
    expect(releaseMatchesFormats(release, ['12"'], "OR")).toBe(false);
    expect(releaseMatchesFormats(release, ["Cassette"], "OR")).toBe(false);
  });

  it("matches selected collector format descriptions", () => {
    const release = releaseWithFormats([
      formatFactory.build({
        name: "Vinyl",
        descriptions: ['12"', "Test Pressing"],
      }),
    ]);

    expect(releaseMatchesFormats(release, ["Test Pressing"], "OR")).toBe(true);
    expect(
      releaseMatchesFormats(release, ["Test Pressing", "White Label"], "OR"),
    ).toBe(true);
    expect(releaseMatchesFormats(release, ["White Label"], "OR")).toBe(false);
  });

  it("matches all selected formats with AND operator", () => {
    const release = releaseWithFormats([
      formatFactory.build({
        name: "Vinyl",
        descriptions: ['12"', "Test Pressing", "White Label"],
      }),
    ]);

    expect(
      releaseMatchesFormats(release, ["Test Pressing", "White Label"], "AND"),
    ).toBe(true);
    expect(releaseMatchesFormats(release, ["Test Pressing", '7"'], "AND")).toBe(
      false,
    );
  });

  it("excludes releases with any selected format when using NONE operator", () => {
    const release = releaseWithFormats([
      formatFactory.build({
        name: "Vinyl",
        descriptions: ['12"', "Test Pressing"],
      }),
    ]);

    expect(releaseMatchesFormats(release, ["Test Pressing"], "NONE")).toBe(
      false,
    );
    expect(releaseMatchesFormats(release, ["White Label"], "NONE")).toBe(true);
  });

  it("matches format filters regardless of casing", () => {
    const release = releaseWithFormats([
      formatFactory.build({
        name: "Vinyl",
        descriptions: ["test pressing"],
      }),
    ]);

    expect(releaseMatchesFormats(release, ["Test Pressing"], "OR")).toBe(true);
    expect(releaseMatchesFormats(release, ["TEST PRESSING"], "OR")).toBe(true);
  });
});
