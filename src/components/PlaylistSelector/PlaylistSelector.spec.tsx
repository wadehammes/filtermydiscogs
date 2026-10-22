import { beforeEach, describe, expect, it } from "@jest/globals";
import { PlaylistSelectorPageObject } from "src/components/PlaylistSelector/PlaylistSelector.po";
import { screen, waitFor } from "test-utils";

let po: PlaylistSelectorPageObject;

describe("PlaylistSelector", () => {
  beforeEach(() => {
    po = new PlaylistSelectorPageObject();
  });

  it("renders PlaylistSelector", () => {
    po.renderPlaylistSelector();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("when there are no playlists, disables the playlist select", async () => {
    po.renderPlaylistSelector();

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: "Select playlist" }),
      ).toBeDisabled();
    });
  });
});
