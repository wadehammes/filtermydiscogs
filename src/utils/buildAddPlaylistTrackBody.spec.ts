import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { buildAddPlaylistTrackBody } from "src/utils/buildAddPlaylistTrackBody";

describe("buildAddPlaylistTrackBody", () => {
  it("includes a public playlist release snapshot with cover art from the collection release", () => {
    const release = releaseFactory.build({
      instance_id: "42",
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "https://i.discogs.com/thumb.jpg",
        cover_image: "https://i.discogs.com/cover.jpg",
      },
    });

    const body = buildAddPlaylistTrackBody({
      release,
      trackPosition: "A",
      trackTitle: "Opening",
    });

    expect(body.release_snapshot?.basic_information.cover_image).toBe(
      "https://i.discogs.com/cover.jpg",
    );
    expect(body.track_key).toBe("42:A");
  });
});
