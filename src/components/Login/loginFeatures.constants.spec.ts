import { describe, expect, it } from "@jest/globals";
import { LOGIN_FEATURES } from "src/components/Login/loginFeatures.constants";

describe("LOGIN_FEATURES", () => {
  it("uses the light and dark playlist screenshots", () => {
    const playlists = LOGIN_FEATURES.find(
      (feature) => feature.eyebrow === "Playlists",
    );

    expect(playlists?.imageBase).toBe("playlist");
    expect(playlists?.themeIndependent).toBeUndefined();
  });
});
