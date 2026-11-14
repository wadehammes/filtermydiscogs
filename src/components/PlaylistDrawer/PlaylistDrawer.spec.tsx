import { beforeEach, describe, expect, it } from "@jest/globals";
import { PlaylistDrawerPageObject } from "src/components/PlaylistDrawer/PlaylistDrawer.po";
import { screen, waitFor } from "test-utils";

let po: PlaylistDrawerPageObject;

describe("PlaylistDrawer", () => {
  beforeEach(() => {
    po = new PlaylistDrawerPageObject();
  });

  it("when open on desktop, wires selector, track list, and footer in the drawer shell", async () => {
    po.renderPlaylistDrawer();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByTestId("fmdPlaylistSelector")).toBeInTheDocument();
    expect(screen.getByTestId("fmdPlaylistDrawerTracks")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("fmdPlaylistDrawerFooter")).toBeInTheDocument();
    });
  });
});
