import { describe, expect, it } from "@jest/globals";
import { labelFactory } from "src/tests/factories/Label.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { resolvePlaylistTrackReleaseMetaLine } from "src/utils/playlistTrackDisplay";

describe("resolvePlaylistTrackReleaseMetaLine", () => {
  it("prefers catalog number from the release when present", () => {
    const release = releaseFactory.withDisplayDefaults({
      instance_id: 9001,
      basic_information: {
        title: "Moodita EP",
        labels: [labelFactory.build({ name: "HSBRGV", catno: "HSBRGV015" })],
      },
    });

    expect(
      resolvePlaylistTrackReleaseMetaLine(
        { release_title: "Moodita EP" },
        release,
      ),
    ).toBe("HSBRGV015");
  });

  it("falls back to stored release title without a release row", () => {
    expect(
      resolvePlaylistTrackReleaseMetaLine({ release_title: "Gaia EP" }, null),
    ).toBe("Gaia EP");
  });
});
