import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  RELEASE_CRATE_MEMBERSHIP_HOVER_PREFETCH_MS,
  resetReleaseCrateMembershipHoverPrefetchForTests,
  shouldRunReleaseCrateMembershipHoverPrefetch,
} from "src/utils/releaseCrateMembershipHoverPrefetch";

describe("releaseCrateMembershipHoverPrefetch", () => {
  beforeEach(() => {
    resetReleaseCrateMembershipHoverPrefetchForTests();
    jest.spyOn(Date, "now").mockReturnValue(0);
  });

  it("when called twice within the throttle window, allows only the first prefetch", () => {
    expect(shouldRunReleaseCrateMembershipHoverPrefetch()).toBe(true);

    jest
      .spyOn(Date, "now")
      .mockReturnValue(RELEASE_CRATE_MEMBERSHIP_HOVER_PREFETCH_MS - 1);

    expect(shouldRunReleaseCrateMembershipHoverPrefetch()).toBe(false);
  });

  it("when called after the throttle window, allows another prefetch", () => {
    expect(shouldRunReleaseCrateMembershipHoverPrefetch()).toBe(true);

    jest
      .spyOn(Date, "now")
      .mockReturnValue(RELEASE_CRATE_MEMBERSHIP_HOVER_PREFETCH_MS);

    expect(shouldRunReleaseCrateMembershipHoverPrefetch()).toBe(true);
  });
});
