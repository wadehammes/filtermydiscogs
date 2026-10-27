import { beforeEach, describe, expect, it } from "@jest/globals";
import { PublicPlaylistTrackVoteControlsPageObject } from "src/components/PublicPlaylistTrackVoteControls/PublicPlaylistTrackVoteControls.po";
import { screen } from "test-utils";

let po: PublicPlaylistTrackVoteControlsPageObject;

describe("PublicPlaylistTrackVoteControls", () => {
  beforeEach(() => {
    po = new PublicPlaylistTrackVoteControlsPageObject();
  });

  it("renders PublicPlaylistTrackVoteControls", () => {
    po.renderPublicPlaylistTrackVoteControls();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });
});
