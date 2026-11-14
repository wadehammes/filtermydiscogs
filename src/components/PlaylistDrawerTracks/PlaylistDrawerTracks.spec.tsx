import { beforeEach, describe, expect, it } from "@jest/globals";
import { PlaylistDrawerTracksPageObject } from "src/components/PlaylistDrawerTracks/PlaylistDrawerTracks.po";
import { screen } from "test-utils";

let po: PlaylistDrawerTracksPageObject;

describe("PlaylistDrawerTracks", () => {
  beforeEach(() => {
    po = new PlaylistDrawerTracksPageObject();
  });

  it("when no playlist is selected, shows the empty-state copy", () => {
    po.renderPlaylistDrawerTracks();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByText("No playlist selected")).toBeInTheDocument();
    expect(
      screen.getByText("Create a playlist or pick one from the menu above."),
    ).toBeInTheDocument();
  });
});
