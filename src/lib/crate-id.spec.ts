import { describe, expect, it } from "@jest/globals";
import { isValidCrateId } from "src/lib/crate-id";

describe("isValidCrateId", () => {
  it("accepts lowercase UUIDs", () => {
    expect(isValidCrateId("a1b2c3d4-e5f6-4789-a012-3456789abcde")).toBe(true);
  });

  it("rejects non-UUID strings", () => {
    expect(isValidCrateId("crate-1")).toBe(false);
    expect(isValidCrateId("../etc/passwd")).toBe(false);
    expect(isValidCrateId("")).toBe(false);
  });
});
