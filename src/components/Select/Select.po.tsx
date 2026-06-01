import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/basePageObject.po";
import {
  defaultSelectOptions,
  type SelectOption,
} from "src/tests/factories/SelectOption.factory";
import type { RenderResult } from "src/tests/utils/test-utils";
import { render } from "src/tests/utils/test-utils";
import Select from "./Select.component";

export type SelectRenderProps = {
  label?: string;
  options?: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
};

export class SelectPageObject extends BasePageObject {
  public testId = "fmdSelect";
  public label = "Test Select";
  public placeholder = "Choose an option";
  public options = defaultSelectOptions();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  private selectElement(overrides: SelectRenderProps = {}) {
    return (
      <Select
        label={this.label}
        options={this.options}
        onChange={jest.fn()}
        {...overrides}
      />
    );
  }

  renderSelect(overrides: SelectRenderProps = {}): RenderResult {
    return render(this.selectElement(overrides));
  }

  renderSelectWithOutsideButton(
    overrides: SelectRenderProps = {},
  ): RenderResult {
    return render(
      <div>
        {this.selectElement(overrides)}
        <button type="button">Outside</button>
      </div>,
    );
  }
}
