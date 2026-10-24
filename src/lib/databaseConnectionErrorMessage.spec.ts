import { describe, expect, it } from "@jest/globals";
import {
  isDatabaseConnectionErrorMessage,
  isPrismaConnectionErrorCode,
  isTransientNodeConnectionError,
} from "src/lib/databaseConnectionErrorMessage";

describe("isPrismaConnectionErrorCode", () => {
  it("when code is P1001, matches", () => {
    expect(isPrismaConnectionErrorCode("P1001")).toBe(true);
  });

  it("when code is unrelated, ignores", () => {
    expect(isPrismaConnectionErrorCode("P2025")).toBe(false);
  });
});

describe("isTransientNodeConnectionError", () => {
  it("when error carries ECONNRESET, matches", () => {
    expect(isTransientNodeConnectionError({ code: "ECONNRESET" })).toBe(true);
  });

  it("when error has no code, ignores", () => {
    expect(isTransientNodeConnectionError(new Error("boom"))).toBe(false);
  });
});

describe("isDatabaseConnectionErrorMessage", () => {
  it("when pg pool reports Connection terminated unexpectedly, matches", () => {
    expect(
      isDatabaseConnectionErrorMessage("Connection terminated unexpectedly"),
    ).toBe(true);
  });

  it("when Postgres reports too many connections for role, matches", () => {
    expect(
      isDatabaseConnectionErrorMessage(
        'too many connections for role "prisma_migration"',
      ),
    ).toBe(true);
  });

  it("when message only mentions timeout without a DB connection phrase, ignores", () => {
    expect(isDatabaseConnectionErrorMessage("Request timeout")).toBe(false);
  });

  it("when message mentions connection in an unrelated API error, ignores", () => {
    expect(
      isDatabaseConnectionErrorMessage(
        "Failed to establish connection to upstream",
      ),
    ).toBe(false);
  });
});
