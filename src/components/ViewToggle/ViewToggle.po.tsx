import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { type ViewMode, ViewToggle } from "./ViewToggle.component";

export type ViewToggleRenderProps = {
  currentView?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
  onRandomClick?: () => void;
  onCratesClick?: () => void;
  isCratesOpen?: boolean;
  className?: string;
};

export class ViewTogglePageObject extends BasePageObject {
  public testId = "fmdViewToggle";
  public onViewChange = jest.fn();
  public onRandomClick = jest.fn();
  public onCratesClick = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  mockScrollTo() {
    const scrollToSpy = jest.fn();
    window.scrollTo = scrollToSpy;
    return scrollToSpy;
  }

  private viewToggleElement(overrides: ViewToggleRenderProps = {}) {
    return (
      <ViewToggle
        currentView="card"
        onViewChange={this.onViewChange}
        {...overrides}
      />
    );
  }

  renderViewToggle(overrides: ViewToggleRenderProps = {}): RenderResult {
    return render(this.viewToggleElement(overrides));
  }

  rerenderViewToggle(
    rerender: RenderResult["rerender"],
    overrides: ViewToggleRenderProps = {},
  ): void {
    rerender(this.viewToggleElement(overrides));
  }
}
