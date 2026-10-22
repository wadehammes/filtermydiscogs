import { beforeEach, describe, expect, it } from "@jest/globals";
import { PlaylistDrawerFooterPageObject } from "src/components/PlaylistDrawerFooter/PlaylistDrawerFooter.po";
import { screen } from "test-utils";

let po: PlaylistDrawerFooterPageObject;

describe("PlaylistDrawerFooter", () => {
  beforeEach(() => {
    po = new PlaylistDrawerFooterPageObject();
  });

  it("renders PlaylistDrawerFooter", () => {
    po.renderPlaylistDrawerFooter();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });
});
