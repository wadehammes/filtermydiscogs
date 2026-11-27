import { beforeEach, describe, expect, it } from "@jest/globals";
import { buildWhatsNewLastSeenStorageKey } from "src/constants/storageKeys";
import { WHATS_NEW_LATEST_VERSION } from "src/constants/whatsNew.constants";
import {
  clearWhatsNewLastSeenForUser,
  hasUnseenWhatsNewForUser,
  persistWhatsNewLastSeenForUser,
} from "src/utils/whatsNewLastSeen";

describe("hasUnseenWhatsNewForUser", () => {
  const userId = "test-user-whats-new";

  beforeEach(() => {
    localStorage.removeItem(buildWhatsNewLastSeenStorageKey(userId));
  });

  it("when nothing was stored, returns true", () => {
    expect(hasUnseenWhatsNewForUser(userId)).toBe(true);
  });

  it("when the stored version matches the latest, returns false", () => {
    persistWhatsNewLastSeenForUser(userId, WHATS_NEW_LATEST_VERSION);

    expect(hasUnseenWhatsNewForUser(userId)).toBe(false);
  });

  it("when the stored version is older, returns true", () => {
    persistWhatsNewLastSeenForUser(userId, "v2020.01.01");

    expect(hasUnseenWhatsNewForUser(userId)).toBe(true);
  });
});

describe("clearWhatsNewLastSeenForUser", () => {
  it("removes the stored last-seen version", () => {
    const userId = "clear-whats-new-user";
    persistWhatsNewLastSeenForUser(userId, WHATS_NEW_LATEST_VERSION);

    clearWhatsNewLastSeenForUser(userId);

    expect(hasUnseenWhatsNewForUser(userId)).toBe(true);
  });
});
