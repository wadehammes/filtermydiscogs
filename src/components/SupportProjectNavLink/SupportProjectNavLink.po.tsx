import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { SupportProjectNavLink } from "./SupportProjectNavLink.component";

export type SupportProjectNavLinkRenderProps = {
  children?: React.ReactNode;
};

export class SupportProjectNavLinkPageObject extends BasePageObject {
  public testId = "fmdSupportProjectNavLink";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private SupportProjectNavLinkElement(
    overrides: SupportProjectNavLinkRenderProps = {},
  ) {
    return <SupportProjectNavLink {...overrides} />;
  }

  renderSupportProjectNavLink(
    overrides: SupportProjectNavLinkRenderProps = {},
  ): RenderResult {
    return render(this.SupportProjectNavLinkElement(overrides));
  }

  rerenderSupportProjectNavLink(
    rerender: RenderResult["rerender"],
    overrides: SupportProjectNavLinkRenderProps = {},
  ): void {
    rerender(this.SupportProjectNavLinkElement(overrides));
  }
}
