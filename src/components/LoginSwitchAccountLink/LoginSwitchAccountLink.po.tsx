import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { LoginSwitchAccountLink } from "./LoginSwitchAccountLink.component";

export type LoginSwitchAccountLinkRenderProps = {
  disabled?: boolean;
  onClick?: () => void;
};

export class LoginSwitchAccountLinkPageObject extends BasePageObject {
  public testId = "fmdLoginSwitchAccountLink";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private LoginSwitchAccountLinkElement(
    overrides: LoginSwitchAccountLinkRenderProps = {},
  ) {
    return (
      <LoginSwitchAccountLink
        onClick={overrides.onClick ?? jest.fn()}
        {...overrides}
      />
    );
  }

  renderLoginSwitchAccountLink(
    overrides: LoginSwitchAccountLinkRenderProps = {},
  ): RenderResult {
    return render(this.LoginSwitchAccountLinkElement(overrides));
  }

  rerenderLoginSwitchAccountLink(
    rerender: RenderResult["rerender"],
    overrides: LoginSwitchAccountLinkRenderProps = {},
  ): void {
    rerender(this.LoginSwitchAccountLinkElement(overrides));
  }
}
