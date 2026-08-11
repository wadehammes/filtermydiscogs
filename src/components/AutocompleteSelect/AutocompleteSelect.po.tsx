import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import {
  defaultSelectOptions,
  type SelectOptionFactoryType,
} from "src/tests/factories/SelectOption.factory";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { AutocompleteSelect } from "./AutocompleteSelect.component";

export type AutocompleteSelectRenderProps = {
  label?: string;
  options?: SelectOptionFactoryType[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
  showLabel?: boolean;
};

export class AutocompleteSelectPageObject extends BasePageObject {
  public testId = "fmdAutocompleteSelect";
  public label = "Test Autocomplete";
  public placeholder = "Choose options...";
  public options = defaultSelectOptions();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  private autocompleteElement(overrides: AutocompleteSelectRenderProps = {}) {
    return (
      <AutocompleteSelect
        label={this.label}
        options={this.options}
        onChange={jest.fn()}
        multiple
        {...overrides}
      />
    );
  }

  renderAutocompleteSelect(
    overrides: AutocompleteSelectRenderProps = {},
  ): RenderResult {
    return render(this.autocompleteElement(overrides));
  }
}
