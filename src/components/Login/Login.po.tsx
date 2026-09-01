jest.mock("src/components/Page/PageFooter.server", () => ({
  PageFooter: () => (
    <>
      <div data-testid="fmdPageFooterFun">
        <p>Community stats</p>
        <p>Live totals from collectors using FilterMyDiscogs.</p>
        <p>128</p>
        <p>Crates created</p>
      </div>
      <footer>
        <a href="/about">About</a>
        <a href="/about#support">Contribute to the project</a>
      </footer>
    </>
  ),
}));

import { PageFooter } from "src/components/Page/PageFooter.server";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { Login } from "./Login.component";

export class LoginPageObject extends BasePageObject {
  public testId = "fmdLogin";
  public layoutTestId = "fmdPublicAuthLayout";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  renderLogin(): RenderResult {
    return render(
      <PublicAuthLayout currentPage="home" footer={<PageFooter />}>
        <Login />
      </PublicAuthLayout>,
    );
  }
}
