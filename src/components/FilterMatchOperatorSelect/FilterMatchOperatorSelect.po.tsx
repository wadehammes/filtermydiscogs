import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import type { StyleOperator } from "src/types/filters.types";
import { render } from "test-utils";
import { FilterMatchOperatorSelect } from "./FilterMatchOperatorSelect.component";

export type FilterMatchOperatorSelectRenderProps = {
  selectedCount?: number;
  value?: StyleOperator;
  onChange?: (value: string | string[]) => void;
  disabled?: boolean;
  showLabel?: boolean;
};

export class FilterMatchOperatorSelectPageObject extends BasePageObject {
  public testId = "fmdFilterMatchOperatorSelect";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private FilterMatchOperatorSelectElement(
    overrides: FilterMatchOperatorSelectRenderProps = {},
  ) {
    const {
      selectedCount = 2,
      value = "OR",
      onChange = jest.fn(),
      disabled,
      showLabel,
    } = overrides;

    return (
      <FilterMatchOperatorSelect
        selectedCount={selectedCount}
        value={value}
        onChange={onChange}
        disabled={disabled ?? false}
        showLabel={showLabel ?? false}
      />
    );
  }

  renderFilterMatchOperatorSelect(
    overrides: FilterMatchOperatorSelectRenderProps = {},
  ): RenderResult {
    return render(this.FilterMatchOperatorSelectElement(overrides));
  }

  rerenderFilterMatchOperatorSelect(
    rerender: RenderResult["rerender"],
    overrides: FilterMatchOperatorSelectRenderProps = {},
  ): void {
    rerender(this.FilterMatchOperatorSelectElement(overrides));
  }
}
