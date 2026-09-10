import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { EmptyState, type EmptyStateProps } from "./EmptyState.component";

export type EmptyStateRenderProps = Partial<EmptyStateProps>;

export class EmptyStatePageObject extends BasePageObject {
  public testId = "fmdEmptyState";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private EmptyStateElement(overrides: EmptyStateRenderProps = {}) {
    return (
      <EmptyState
        title="Nothing here yet"
        description="Try adjusting your filters."
        {...overrides}
      />
    );
  }

  renderEmptyState(overrides: EmptyStateRenderProps = {}): RenderResult {
    return render(this.EmptyStateElement(overrides));
  }

  rerenderEmptyState(
    rerender: RenderResult["rerender"],
    overrides: EmptyStateRenderProps = {},
  ): void {
    rerender(this.EmptyStateElement(overrides));
  }
}
