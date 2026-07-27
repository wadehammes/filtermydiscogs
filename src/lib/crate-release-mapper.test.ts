import { describe, expect, it } from "@jest/globals";
import { mapCrateReleaseRow } from "src/lib/crate-release-mapper";
import { releaseFactory } from "src/tests/factories/Release.factory";

describe("mapCrateReleaseRow", () => {
  it("maps release_data and found_at to a crate release item", () => {
    const release = releaseFactory.build({ instance_id: "12345" });
    const foundAt = new Date("2026-07-27T00:00:00.000Z");

    const result = mapCrateReleaseRow({
      release_data: release,
      found_at: foundAt,
    });

    expect(result.release.instance_id).toBe("12345");
    expect(result.found_at).toBe(foundAt.toISOString());
  });

  it("returns null found_at when not set", () => {
    const release = releaseFactory.build();

    const result = mapCrateReleaseRow({
      release_data: release,
      found_at: null,
    });

    expect(result.found_at).toBeNull();
  });
});
