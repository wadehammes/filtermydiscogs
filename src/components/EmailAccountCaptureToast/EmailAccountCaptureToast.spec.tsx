import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { EmailAccountCaptureToastPageObject } from "src/components/EmailAccountCaptureToast/EmailAccountCaptureToast.po";
import { SITE_NAME } from "src/constants/siteMetadata";
import { buildEmailAccountToastDismissedStorageKey } from "src/constants/storageKeys";
import { act, screen, waitFor } from "test-utils";

describe("EmailAccountCaptureToast", () => {
  let po: EmailAccountCaptureToastPageObject;

  beforeEach(() => {
    jest.useFakeTimers();
    po = new EmailAccountCaptureToastPageObject();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("when the user has no saved email, shows a one-time action toast linking to Account settings", async () => {
    po.renderEmailAccountCaptureToast();

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByText("Add an email address")).toBeInTheDocument();
    });
  });

  it("when the user dismisses the toast, persists dismissal for that user", async () => {
    const userId = "123";
    po.renderEmailAccountCaptureToast({ userId });

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByText("Add an email address")).toBeInTheDocument();
    });

    const dismissButton = document.querySelector<HTMLButtonElement>(
      'button.toastHeaderButton[aria-label="Dismiss notification"]',
    );
    expect(dismissButton).not.toBeNull();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(dismissButton!);

    expect(
      localStorage.getItem(buildEmailAccountToastDismissedStorageKey(userId)),
    ).toBe("1");
  });

  it("when the support toast is eligible, does not show the email capture toast", async () => {
    po.renderPromotionalToastHosts({ showSupportProjectToast: true });

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByText(`Keep ${SITE_NAME} running`)).toBeInTheDocument();
    });

    expect(screen.queryByText("Add an email address")).not.toBeInTheDocument();
  });
});
