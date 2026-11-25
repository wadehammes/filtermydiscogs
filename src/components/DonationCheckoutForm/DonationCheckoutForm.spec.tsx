import { beforeEach, describe, expect, it } from "@jest/globals";
import { DonationCheckoutFormPageObject } from "src/components/DonationCheckoutForm/DonationCheckoutForm.po";
import { screen } from "test-utils";

let po: DonationCheckoutFormPageObject;

describe("DonationCheckoutForm", () => {
  beforeEach(() => {
    po = new DonationCheckoutFormPageObject();
  });

  it("renders preset amounts and custom donation controls", () => {
    po.renderDonationCheckoutForm();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "$5" })).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: "Or enter a custom amount (USD)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Secure checkout powered by Stripe.")).toBeInTheDocument();
  });
});
