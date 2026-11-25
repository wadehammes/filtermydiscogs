import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { SupportProjectToastPageObject } from "src/components/SupportProjectToast/SupportProjectToast.po";
import { act } from "test-utils";

describe("SupportProjectToast", () => {
  let po: SupportProjectToastPageObject;

  beforeEach(() => {
    jest.useFakeTimers();
    po = new SupportProjectToastPageObject();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("when auth marks the support toast eligible, shows the support toast once after mount", async () => {
    po.renderSupportProjectToast();

    await act(async () => {
      jest.runAllTimers();
    });

    expect(po.mockShowSupportProjectToast).toHaveBeenCalledTimes(1);
  });
});
