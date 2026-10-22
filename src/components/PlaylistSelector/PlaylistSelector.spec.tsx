import { beforeEach, describe, expect, it } from "@jest/globals";
import { PlaylistSelectorPageObject } from "src/components/PlaylistSelector/PlaylistSelector.po";
import { screen } from "test-utils";

let po: PlaylistSelectorPageObject;

describe("PlaylistSelector", () => {
  beforeEach(() => {
    po = new PlaylistSelectorPageObject();
  });

  it("renders PlaylistSelector", () => {
    po.renderPlaylistSelector();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });
});
