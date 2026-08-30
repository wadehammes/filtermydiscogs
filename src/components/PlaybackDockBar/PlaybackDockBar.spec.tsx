import { beforeEach, describe, expect, it } from "@jest/globals";
import { PlaybackDockBarPageObject } from "src/components/PlaybackDockBar/PlaybackDockBar.po";
import { screen } from "test-utils";

let po: PlaybackDockBarPageObject;

describe("PlaybackDockBar", () => {
  beforeEach(() => {
    po = new PlaybackDockBarPageObject();
  });

  it("renders PlaybackDockBar", () => {
    po.renderPlaybackDockBar();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });
});
