import { beforeEach, describe, expect, it } from "@jest/globals";
import { checkRateLimit } from "src/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    for (let userId = 900_000; userId < 900_010; userId += 1) {
      for (let attempt = 0; attempt < 200; attempt += 1) {
        checkRateLimit(userId, false);
        checkRateLimit(userId, true);
      }
    }
  });

  it("returns allowed until the per-user read limit is exceeded", () => {
    const userId = 900_100;
    const maxReads = parseInt(process.env.DB_RATE_LIMIT_MAX || "100", 10);

    for (let index = 0; index < maxReads; index += 1) {
      const result = checkRateLimit(userId, false);
      expect(result.allowed).toBe(true);
    }

    const blocked = checkRateLimit(userId, false);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("does not count reads against the write limit", () => {
    const userId = 900_101;
    const maxReads = parseInt(process.env.DB_RATE_LIMIT_MAX || "100", 10);

    for (let index = 0; index < maxReads; index += 1) {
      checkRateLimit(userId, false);
    }

    const writeCheck = checkRateLimit(userId, true);
    expect(writeCheck.allowed).toBe(true);
  });

  it("returns allowed until the per-user write limit is exceeded", () => {
    const userId = 900_102;
    const maxWrites = parseInt(
      process.env.DB_RATE_LIMIT_MAX_WRITES || "60",
      10,
    );

    for (let index = 0; index < maxWrites; index += 1) {
      const result = checkRateLimit(userId, true);
      expect(result.allowed).toBe(true);
    }

    const blocked = checkRateLimit(userId, true);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
