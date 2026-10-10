import { describe, expect, it } from "@jest/globals";
import {
  CrateSyncError,
  inferCrateSyncBlockedReason,
} from "src/utils/crateSyncError";

describe("crateSyncError", () => {
  it("infers blocked sync reasons from API error bodies", () => {
    expect(
      inferCrateSyncBlockedReason({
        collectionSize: 3,
        minRequired: 10,
      }),
    ).toBe("collection_too_small");

    expect(
      inferCrateSyncBlockedReason({
        percentage: 55,
        maxAllowed: 50,
      }),
    ).toBe("deletion_cap_blocked");

    expect(inferCrateSyncBlockedReason({ error: "nope" })).toBeUndefined();

    expect(
      inferCrateSyncBlockedReason({ blockedReason: "collection_too_small" }),
    ).toBe("collection_too_small");
  });

  it("carries blocked reason on CrateSyncError", () => {
    const error = new CrateSyncError("blocked", 400, "deletion_cap_blocked");
    expect(error.blockedReason).toBe("deletion_cap_blocked");
    expect(error.status).toBe(400);
  });
});
