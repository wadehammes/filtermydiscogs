import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import {
  DonationCheckoutForm,
  type DonationCheckoutFormProps,
} from "./DonationCheckoutForm.component";

export type DonationCheckoutFormRenderProps = DonationCheckoutFormProps;

export class DonationCheckoutFormPageObject extends BasePageObject {
  public testId = "fmdDonationCheckoutForm";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private DonationCheckoutFormElement(
    overrides: DonationCheckoutFormRenderProps = {},
  ) {
    return <DonationCheckoutForm {...overrides} />;
  }

  renderDonationCheckoutForm(
    overrides: DonationCheckoutFormRenderProps = {},
  ): RenderResult {
    return render(this.DonationCheckoutFormElement(overrides));
  }

  rerenderDonationCheckoutForm(
    rerender: RenderResult["rerender"],
    overrides: DonationCheckoutFormRenderProps = {},
  ): void {
    rerender(this.DonationCheckoutFormElement(overrides));
  }
}
