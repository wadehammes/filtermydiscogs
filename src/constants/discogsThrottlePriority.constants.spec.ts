import { describe, expect, it } from "@jest/globals";
import { DISCOGS_THROTTLE_CALLERS } from "src/constants/discogsThrottleCaller.constants";
import { resolveDiscogsThrottlePriority } from "src/constants/discogsThrottlePriority.constants";

describe("discogsThrottlePriority.constants", () => {
  it("treats public playlist hydrate as background priority", () => {
    expect(
      resolveDiscogsThrottlePriority(
        DISCOGS_THROTTLE_CALLERS.publicPlaylistHydrate,
      ),
    ).toBe("background");
  });

  it("treats release API callers as interactive priority", () => {
    expect(
      resolveDiscogsThrottlePriority(DISCOGS_THROTTLE_CALLERS.apiRelease),
    ).toBe("interactive");
    expect(
      resolveDiscogsThrottlePriority(DISCOGS_THROTTLE_CALLERS.apiReleaseBatch),
    ).toBe("interactive");
    expect(
      resolveDiscogsThrottlePriority(
        DISCOGS_THROTTLE_CALLERS.publicReleasePage,
      ),
    ).toBe("interactive");
  });

  it("treats unknown and missing callers as background priority", () => {
    expect(resolveDiscogsThrottlePriority(undefined)).toBe("background");
  });
});
