import { beforeEach, describe, expect, it } from "@jest/globals";
import { AppToaster } from "src/components/AppToaster/AppToaster.component";
import { DonationSuccessToast } from "src/components/DonationSuccessToast/DonationSuccessToast.component";
import { resetMountedStoreForTests } from "src/hooks/useMounted.hook";
import { setWindowLocation } from "src/tests/mocks/mockWindowLocation";
import { render, screen, waitFor } from "test-utils";

describe("DonationSuccessToast", () => {
  beforeEach(() => {
    resetMountedStoreForTests();
  });

  it("shows a success toast after AppToaster mounts when donated=1 is present", async () => {
    setWindowLocation("http://localhost/about?donated=1#support");

    render(
      <>
        <AppToaster />
        <DonationSuccessToast />
      </>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Thank you for your support!"),
      ).toBeInTheDocument();
    });
  });
});
