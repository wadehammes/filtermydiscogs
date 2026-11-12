import { beforeEach, describe, expect, it } from "@jest/globals";
import { VIEW_STATE_STORAGE_KEY } from "src/constants/storageKeys";
import { useReleasesLoadingViewMode } from "src/hooks/useReleasesLoadingViewMode.hook";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { renderFeatureHook, waitFor } from "test-utils";

describe("useReleasesLoadingViewMode", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-collection-view");
  });

  it("returns list on desktop when localStorage prefers list", async () => {
    setupMockMatchMedia({ desktop: true });
    localStorage.setItem(
      VIEW_STATE_STORAGE_KEY,
      JSON.stringify({ currentView: "list", previousView: "card" }),
    );

    const { result } = renderFeatureHook(() => useReleasesLoadingViewMode());

    await waitFor(() => {
      expect(result.current).toBe("list");
    });
  });

  it("coerces list to card on compact layout", async () => {
    setupMockMatchMedia({ desktop: false });
    document.documentElement.setAttribute("data-collection-view", "list");

    const { result } = renderFeatureHook(() => useReleasesLoadingViewMode());

    await waitFor(() => {
      expect(result.current).toBe("card");
    });
  });
});
