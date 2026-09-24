import { describe, expect, it } from "@jest/globals";
import {
  isProtectedAppRoute,
  isPublicCrateRoute,
} from "src/constants/protectedRoutes";

describe("protectedRoutes", () => {
  it("detects public shared crate paths", () => {
    expect(
      isPublicCrateRoute("/crate/ab65c378-fab9-42c0-96bb-c308d413cbbb"),
    ).toBe(true);
    expect(isPublicCrateRoute("/crate/")).toBe(false);
    expect(isPublicCrateRoute("/crates/abc")).toBe(false);
    expect(isPublicCrateRoute("/")).toBe(false);
  });

  it("detects protected app routes without treating public crates as owner crates", () => {
    expect(isProtectedAppRoute("/releases")).toBe(true);
    expect(isProtectedAppRoute("/crates/abc")).toBe(true);
    expect(
      isProtectedAppRoute("/crate/ab65c378-fab9-42c0-96bb-c308d413cbbb"),
    ).toBe(false);
  });
});
