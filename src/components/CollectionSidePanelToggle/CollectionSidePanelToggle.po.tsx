import type { RenderResult } from "@testing-library/react";
import {
  CollectionSidePanelToggle,
  type CollectionSidePanelToggleProps,
} from "src/components/CollectionSidePanelToggle/CollectionSidePanelToggle.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";

export type CollectionSidePanelToggleRenderProps =
  Partial<CollectionSidePanelToggleProps>;

const defaultProps: CollectionSidePanelToggleProps = {
  sidePanel: "crates",
  isDrawerOpen: false,
  onSelectSidePanel: () => {},
};

export class CollectionSidePanelTogglePageObject extends BasePageObject {
  public testId = "fmdCollectionSidePanelToggle";
  public onSelectSidePanel = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private collectionSidePanelToggleElement(
    overrides: CollectionSidePanelToggleRenderProps = {},
  ) {
    return (
      <CollectionSidePanelToggle
        {...defaultProps}
        onSelectSidePanel={this.onSelectSidePanel}
        {...overrides}
      />
    );
  }

  renderCollectionSidePanelToggle(
    overrides: CollectionSidePanelToggleRenderProps = {},
  ): RenderResult {
    return render(this.collectionSidePanelToggleElement(overrides));
  }

  rerenderCollectionSidePanelToggle(
    rerender: RenderResult["rerender"],
    overrides: CollectionSidePanelToggleRenderProps = {},
  ): void {
    rerender(this.collectionSidePanelToggleElement(overrides));
  }
}
