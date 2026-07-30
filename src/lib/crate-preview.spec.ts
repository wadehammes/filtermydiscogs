import { describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  CRATE_HUB_PREVIEW_COUNT,
  extractPreviewThumbUrl,
  groupPreviewThumbsByCrateId,
} from "./crate-preview";

const buildPreviewRow = (crateId: string, thumb: string) => ({
  crate_id: crateId,
  release_data: releaseFactory.build({
    basic_information: basicInformationFactory.build({
      thumb,
      cover_image: "",
    }),
  }),
});

describe("crate-preview", () => {
  it("extractPreviewThumbUrl prefers cover art from release_data", () => {
    const release = releaseFactory.build();
    release.basic_information.thumb = "https://example.com/thumb.jpg";
    release.basic_information.cover_image = "https://example.com/cover.jpg";

    expect(extractPreviewThumbUrl(release)).toBe(
      "https://example.com/cover.jpg",
    );
  });

  it("groupPreviewThumbsByCrateId keeps the first three ordered releases per crate", () => {
    const rows = [
      buildPreviewRow("crate-a", "https://example.com/a1.jpg"),
      buildPreviewRow("crate-a", "https://example.com/a2.jpg"),
      buildPreviewRow("crate-a", "https://example.com/a3.jpg"),
      buildPreviewRow("crate-a", "https://example.com/a4.jpg"),
      buildPreviewRow("crate-b", "https://example.com/b1.jpg"),
    ];

    const grouped = groupPreviewThumbsByCrateId(rows);

    expect(grouped.get("crate-a")).toEqual([
      "https://example.com/a1.jpg",
      "https://example.com/a2.jpg",
      "https://example.com/a3.jpg",
    ]);
    expect(grouped.get("crate-b")).toEqual(["https://example.com/b1.jpg"]);
    expect(CRATE_HUB_PREVIEW_COUNT).toBe(3);
  });
});
