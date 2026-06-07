import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { validateReleaseDataForStorage } from "./release-data-validation";

describe("validateReleaseDataForStorage", () => {
  it("accepts valid release data", () => {
    const release = releaseFactory.build();
    const result = validateReleaseDataForStorage(release);

    expect("release" in result).toBe(true);
    if ("release" in result) {
      expect(result.release.instance_id).toBe(String(release.instance_id));
    }
  });

  it("rejects releases without instance_id", () => {
    const release = releaseFactory.build({ instance_id: "" });
    const result = validateReleaseDataForStorage(release);

    expect(result).toEqual({
      error: "Invalid release data: missing instance_id",
    });
  });

  it("strips non-Discogs image URLs", () => {
    const release = releaseFactory.build({
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "https://evil.example/thumb.jpg",
        cover_image: "https://i.discogs.com/safe.jpg",
      },
    });

    const result = validateReleaseDataForStorage(release);
    expect("release" in result).toBe(true);
    if ("release" in result) {
      expect(result.release.basic_information.thumb).toBe("");
      expect(result.release.basic_information.cover_image).toBe(
        "https://i.discogs.com/safe.jpg",
      );
    }
  });
});
