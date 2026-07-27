import { beforeEach, describe, expect, it } from "@jest/globals";
import { LoginSwitchAccountLinkPageObject } from "src/components/LoginSwitchAccountLink/LoginSwitchAccountLink.po";
import { screen } from "test-utils";

let po: LoginSwitchAccountLinkPageObject;

describe("LoginSwitchAccountLink", () => {
  beforeEach(() => {
    po = new LoginSwitchAccountLinkPageObject();
  });

  it("renders LoginSwitchAccountLink", () => {
    po.renderLoginSwitchAccountLink();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use a different Discogs account?" }),
    ).toBeInTheDocument();
  });
});
