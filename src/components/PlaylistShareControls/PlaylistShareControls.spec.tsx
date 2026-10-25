import { beforeEach, describe, expect, it } from "@jest/globals";
import { PlaylistShareControlsPageObject } from "src/components/PlaylistShareControls/PlaylistShareControls.po";
import { screen } from "test-utils";

let po: PlaylistShareControlsPageObject;

describe("PlaylistShareControls", () => {
  beforeEach(() => {
    po = new PlaylistShareControlsPageObject();
  });

  it("renders PlaylistShareControls", () => {
    po.renderPlaylistShareControls();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });
});
