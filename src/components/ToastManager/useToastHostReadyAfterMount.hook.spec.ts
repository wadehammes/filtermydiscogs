import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { useToastHostReadyAfterMount } from "src/components/ToastManager/useToastHostReadyAfterMount.hook";
import { act, renderHook } from "test-utils";

describe("useToastHostReadyAfterMount", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("when mounted, becomes ready after the next macrotask", () => {
    const { result } = renderHook(() => useToastHostReadyAfterMount());

    expect(result.current).toBe(false);

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current).toBe(true);
  });
});
