import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { ScrollReveal } from "./ScrollReveal.component";

export type ScrollRevealRenderProps = {
  children?: React.ReactNode;
};

export class ScrollRevealPageObject extends BasePageObject {
  public testId = "fmdScrollReveal";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private ScrollRevealElement(overrides: ScrollRevealRenderProps = {}) {
    return (
      <ScrollReveal data-testid={this.testId} {...overrides}>
        Scroll reveal
      </ScrollReveal>
    );
  }

  renderScrollReveal(overrides: ScrollRevealRenderProps = {}): RenderResult {
    return render(this.ScrollRevealElement(overrides));
  }

  rerenderScrollReveal(
    rerender: RenderResult["rerender"],
    overrides: ScrollRevealRenderProps = {},
  ): void {
    rerender(this.ScrollRevealElement(overrides));
  }
}
