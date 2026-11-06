import { describe, expect, it } from "@jest/globals";
import {
  isProtectedAppRoute,
  isPublicCrateRoute,
  isPublicPlaylistRoute,
  isPublicReleaseRoute,
  isPublicShareRoute,
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

  it("detects public shared playlist paths", () => {
    expect(
      isPublicPlaylistRoute("/playlist/11111111-2222-3333-4444-555555555555"),
    ).toBe(true);
    expect(isPublicPlaylistRoute("/playlist/")).toBe(false);
    expect(isPublicPlaylistRoute("/playlists/abc")).toBe(false);
  });

  it("detects public release listen paths", () => {
    expect(isPublicReleaseRoute("/release/249504")).toBe(true);
    expect(isPublicReleaseRoute("/release/")).toBe(false);
    expect(isPublicReleaseRoute("/releases/249504")).toBe(false);
  });

  it("detects public share routes as crate, playlist, or release paths", () => {
    expect(
      isPublicShareRoute("/crate/ab65c378-fab9-42c0-96bb-c308d413cbbb"),
    ).toBe(true);
    expect(
      isPublicShareRoute("/playlist/11111111-2222-3333-4444-555555555555"),
    ).toBe(true);
    expect(isPublicShareRoute("/release/249504")).toBe(true);
    expect(isPublicShareRoute("/releases")).toBe(false);
  });

  it("detects protected app routes without treating public crates as owner crates", () => {
    expect(isProtectedAppRoute("/releases")).toBe(true);
    expect(isProtectedAppRoute("/crates/abc")).toBe(true);
    expect(
      isProtectedAppRoute("/crate/ab65c378-fab9-42c0-96bb-c308d413cbbb"),
    ).toBe(false);
  });
});
