import {
  buildMosaicExportFileName,
  sanitizeMosaicFilePrefix,
} from "src/utils/mosaicExport";

describe("sanitizeMosaicFilePrefix", () => {
  it("when the name has spaces and punctuation, slugifies for file names", () => {
    expect(sanitizeMosaicFilePrefix("  My Crate!  ")).toBe("my-crate");
  });

  it("when the name is only symbols, returns mosaic", () => {
    expect(sanitizeMosaicFilePrefix("!!!")).toBe("mosaic");
  });
});

describe("buildMosaicExportFileName", () => {
  it("when given jpeg and a prefix, uses jpg extension and slugified prefix", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-26T12:00:00.000Z"));

    expect(buildMosaicExportFileName("jpeg", "Funk Finds")).toBe(
      "funk-finds-2026-11-26.jpg",
    );

    jest.useRealTimers();
  });

  it("when given png without a prefix, uses discogs-mosaic and png extension", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-26T12:00:00.000Z"));

    expect(buildMosaicExportFileName("png")).toBe(
      "discogs-mosaic-2026-11-26.png",
    );

    jest.useRealTimers();
  });
});
