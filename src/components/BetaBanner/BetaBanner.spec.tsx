import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { BetaBannerPageObject } from "src/components/BetaBanner/BetaBanner.po";
import { SUBMIT_BUG_REPORT_NAV_LABEL } from "src/constants/sentryUserFeedback.constants";
import { screen } from "test-utils";

let po: BetaBannerPageObject;

describe("BetaBanner", () => {
  beforeEach(() => {
    po = new BetaBannerPageObject();
  });

  it("calls onSubmitBugReport when Submit bug report is pressed", async () => {
    const onSubmitBugReport = jest.fn();
    po.renderBetaBanner({ onSubmitBugReport });

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: SUBMIT_BUG_REPORT_NAV_LABEL }),
    );

    expect(onSubmitBugReport).toHaveBeenCalledTimes(1);
  });
});
