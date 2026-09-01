import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { setWindowLocation } from "src/tests/mocks/mockWindowLocation";
import { toast } from "src/utils/toast";
import { handleDonationSuccessReturn } from "./donationSuccessToast";

describe("handleDonationSuccessReturn", () => {
  let toastSuccessSpy: jest.SpiedFunction<typeof toast.success>;

  beforeEach(() => {
    toastSuccessSpy = jest
      .spyOn(toast, "success")
      .mockReturnValue("test-toast-id");
    setWindowLocation("http://localhost/about");
  });

  afterEach(() => {
    toastSuccessSpy.mockRestore();
  });

  it("shows a success toast when donated=1 is in the query string", () => {
    setWindowLocation("http://localhost/about?donated=1#support");
    const handledRef = { current: false };

    handleDonationSuccessReturn(handledRef);

    expect(toastSuccessSpy).toHaveBeenCalledWith("Thank you for your support!");
    expect(handledRef.current).toBe(true);
    expect(window.location.pathname).toBe("/about");
    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("#support");
  });

  it("does nothing when the donated query param is absent", () => {
    const handledRef = { current: false };

    handleDonationSuccessReturn(handledRef);

    expect(toastSuccessSpy).not.toHaveBeenCalled();
    expect(handledRef.current).toBe(false);
  });

  it("does nothing when donation success was already handled", () => {
    setWindowLocation("http://localhost/about?donated=1");
    const handledRef = { current: true };

    handleDonationSuccessReturn(handledRef);

    expect(toastSuccessSpy).not.toHaveBeenCalled();
  });
});
