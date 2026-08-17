import { describe, expect, it } from "@jest/globals";
import {
  crateReleaseStorageSchema,
  MAX_RELEASE_DATA_BYTES,
} from "src/lib/validation/releaseStorage.schemas";
import { releaseFactory } from "src/tests/factories/Release.factory";

describe("crateReleaseStorageSchema", () => {
  it("accepts valid release payloads", () => {
    const release = releaseFactory.build();

    expect(crateReleaseStorageSchema.safeParse(release).success).toBe(true);
  });

  it("rejects releases without instance_id", () => {
    const result = crateReleaseStorageSchema.safeParse(
      releaseFactory.build({ instance_id: "" }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Invalid release data: missing instance_id",
      );
    }
  });

  it("rejects releases without basic_information title", () => {
    const release = releaseFactory.build();
    const invalidRelease = {
      ...release,
      basic_information: {
        ...release.basic_information,
        title: "   ",
      },
    };

    const result = crateReleaseStorageSchema.safeParse(invalidRelease);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Invalid release data: missing basic_information",
      );
    }
  });

  it("rejects oversized payloads", () => {
    const release = releaseFactory.build({
      basic_information: {
        ...releaseFactory.build().basic_information,
        title: "a".repeat(MAX_RELEASE_DATA_BYTES),
      },
    });

    const result = crateReleaseStorageSchema.safeParse(release);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Release data is too large");
    }
  });
});
