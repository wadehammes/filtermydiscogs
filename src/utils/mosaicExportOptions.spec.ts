import {
  listMosaicAspectRatioEntries,
  listMosaicImageFormats,
} from "src/utils/mosaicExportOptions";

describe("mosaicExportOptions", () => {
  it("when listMosaicImageFormats is called, returns jpeg and png", () => {
    expect(listMosaicImageFormats()).toEqual([
      { value: "jpeg", label: "JPEG" },
      { value: "png", label: "PNG" },
    ]);
  });

  it("when listMosaicAspectRatioEntries is called, includes square and mobile landscape labels", () => {
    const entries = listMosaicAspectRatioEntries();

    expect(entries.map(([key]) => key)).toContain("SQUARE");
    expect(entries.find(([key]) => key === "SQUARE")?.[1].name).toBe("Square");
    expect(entries.find(([key]) => key === "MOBILE_LANDSCAPE")?.[1].name).toBe(
      "Mobile Landscape (19.5:9)",
    );
  });
});
