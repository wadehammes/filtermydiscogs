import { describe, expect, it, jest } from "@jest/globals";
import { useShowToastOnce } from "src/components/ToastManager/useShowToastOnce.hook";
import { renderHook } from "test-utils";

describe("useShowToastOnce", () => {
  it("when ready becomes true, invokes the show callback only once", () => {
    const show = jest.fn();

    const { rerender } = renderHook(
      ({ ready }: { ready: boolean }) => useShowToastOnce(ready, show),
      { initialProps: { ready: false } },
    );

    expect(show).not.toHaveBeenCalled();

    rerender({ ready: true });
    expect(show).toHaveBeenCalledTimes(1);

    rerender({ ready: true });
    expect(show).toHaveBeenCalledTimes(1);

    rerender({ ready: false });
    rerender({ ready: true });
    expect(show).toHaveBeenCalledTimes(1);
  });
});
