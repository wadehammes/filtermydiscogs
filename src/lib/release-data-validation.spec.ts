import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  toPublicReleaseSnapshot,
  validateReleaseDataForStorage,
} from "./release-data-validation";

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

describe("toPublicReleaseSnapshot", () => {
  it("returns only public card fields", () => {
    const release = releaseFactory.build({
      notes: [{ field_id: 1, value: "Private note" }],
      rating: 5,
      date_added: "2020-01-01T00:00:00",
      folder_id: 1,
    });

    const snapshot = toPublicReleaseSnapshot(release);

    expect(snapshot.instance_id).toBe(String(release.instance_id));
    expect(snapshot.basic_information.title).toBe(
      release.basic_information.title,
    );
    expect(snapshot).not.toHaveProperty("notes");
    expect(snapshot).not.toHaveProperty("rating");
    expect(snapshot).not.toHaveProperty("date_added");
  });
});
