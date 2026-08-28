import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { HorizontalScrollRow } from "./HorizontalScrollRow.component";

export type HorizontalScrollRowRenderProps = {
  children?: React.ReactNode;
};

export class HorizontalScrollRowPageObject extends BasePageObject {
  public testId = "fmdHorizontalScrollRow";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private HorizontalScrollRowElement(
    overrides: HorizontalScrollRowRenderProps = {},
  ) {
    const { children, ...rest } = overrides;

    return (
      <HorizontalScrollRow data-testid={this.testId} {...rest}>
        {children ?? (
          <>
            <span>Alpha</span>
            <span>Beta</span>
          </>
        )}
      </HorizontalScrollRow>
    );
  }

  renderHorizontalScrollRow(
    overrides: HorizontalScrollRowRenderProps = {},
  ): RenderResult {
    return render(this.HorizontalScrollRowElement(overrides));
  }
}
