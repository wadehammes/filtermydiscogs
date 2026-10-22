import { beforeEach, describe, expect, it } from "@jest/globals";
import { PlaylistDrawerPageObject } from "src/components/PlaylistDrawer/PlaylistDrawer.po";
import { screen } from "test-utils";

let po: PlaylistDrawerPageObject;

describe("PlaylistDrawer", () => {
  beforeEach(() => {
    po = new PlaylistDrawerPageObject();
  });

  it("renders PlaylistDrawer", () => {
    po.renderPlaylistDrawer();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });
});
