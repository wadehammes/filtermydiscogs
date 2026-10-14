import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PlaylistDrawerBetaBannerPageObject } from "src/components/PlaylistDrawerBetaBanner/PlaylistDrawerBetaBanner.po";
import { SUBMIT_BUG_REPORT_NAV_LABEL } from "src/constants/sentryUserFeedback.constants";
import { screen } from "test-utils";

let po: PlaylistDrawerBetaBannerPageObject;

describe("PlaylistDrawerBetaBanner", () => {
  beforeEach(() => {
    po = new PlaylistDrawerBetaBannerPageObject();
  });

  it("calls onSubmitBugReport when Submit bug report is pressed", async () => {
    const onSubmitBugReport = jest.fn();
    po.renderPlaylistDrawerBetaBanner({ onSubmitBugReport });

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: SUBMIT_BUG_REPORT_NAV_LABEL }),
    );

    expect(onSubmitBugReport).toHaveBeenCalledTimes(1);
  });
});
