import { beforeEach, describe, expect, it } from "@jest/globals";
import { PlaylistDrawerTracksPageObject } from "src/components/PlaylistDrawerTracks/PlaylistDrawerTracks.po";
import { screen } from "test-utils";

let po: PlaylistDrawerTracksPageObject;

describe("PlaylistDrawerTracks", () => {
  beforeEach(() => {
    po = new PlaylistDrawerTracksPageObject();
  });

  it("renders PlaylistDrawerTracks", () => {
    po.renderPlaylistDrawerTracks();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });
});
