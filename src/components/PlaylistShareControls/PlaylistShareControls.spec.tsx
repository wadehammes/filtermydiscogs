import { beforeEach, describe, expect, it } from "@jest/globals";
import { PlaylistShareControlsPageObject } from "src/components/PlaylistShareControls/PlaylistShareControls.po";
import { screen } from "test-utils";

let po: PlaylistShareControlsPageObject;

describe("PlaylistShareControls", () => {
  beforeEach(() => {
    po = new PlaylistShareControlsPageObject();
  });

  it("when playlist detail is still loading, disables the public link switch", () => {
    po.mockActivePlaylistPending();
    po.renderPlaylistShareControls();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Public link/i })).toBeDisabled();
  });

  it("when the active playlist is private, shows only-you copy and keeps copy hidden", () => {
    po.mockActivePlaylist();
    po.renderPlaylistShareControls();

    expect(
      screen.getByText("Only you can view this playlist."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy link" }),
    ).not.toBeInTheDocument();
  });
});
