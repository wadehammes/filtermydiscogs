import type { RenderResult } from "@testing-library/react";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import {
  CollectionSortControls,
  type CollectionSortControlsProps,
} from "./CollectionSortControls.component";

export type CollectionSortControlsRenderProps =
  Partial<CollectionSortControlsProps>;

export class CollectionSortControlsPageObject extends BasePageObject {
  public testId = "fmdCollectionSortControls";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private CollectionSortControlsElement(
    overrides: CollectionSortControlsRenderProps = {},
  ) {
    return (
      <CollectionSortControls
        primarySort={SortValues.DateAddedNew}
        secondarySort={SortSecondaryValues.None}
        onPrimarySortChange={() => {}}
        onSecondarySortChange={() => {}}
        {...overrides}
      />
    );
  }

  renderCollectionSortControls(
    overrides: CollectionSortControlsRenderProps = {},
  ): RenderResult {
    return render(this.CollectionSortControlsElement(overrides));
  }

  rerenderCollectionSortControls(
    rerender: RenderResult["rerender"],
    overrides: CollectionSortControlsRenderProps = {},
  ): void {
    rerender(this.CollectionSortControlsElement(overrides));
  }
}
