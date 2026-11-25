import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { dismissEmailAccountCaptureToast } from "src/components/EmailAccountCaptureToast/emailAccountToast";
import { EMAIL_ACCOUNT_CAPTURE_TOAST_ID } from "src/constants/emailAccountToast.constants";
import { toast } from "src/utils/toast";

describe("emailAccountToast", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("when dismissed by id, clears only the email capture toast", () => {
    const dismissSpy = jest
      .spyOn(toast, "dismiss")
      .mockImplementation(() => {});

    dismissEmailAccountCaptureToast();

    expect(dismissSpy).toHaveBeenCalledWith(EMAIL_ACCOUNT_CAPTURE_TOAST_ID);
  });
});
