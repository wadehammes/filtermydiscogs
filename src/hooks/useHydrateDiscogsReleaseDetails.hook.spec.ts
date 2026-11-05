import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { api } from "src/api/urls";
import { useHydrateDiscogsReleaseDetails } from "src/hooks/useHydrateDiscogsReleaseDetails.hook";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

describe("useHydrateDiscogsReleaseDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockApi, {
      discogsRelease: jest.fn(),
      discogsReleaseBatch: jest.fn(),
    });
  });

  it("when release ids are provided, loads details via batch and exposes a map", async () => {
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
    });
    setupFetchDiscogsReleaseMock(mockApi, detail);

    const { result } = renderFeatureHook(() =>
      useHydrateDiscogsReleaseDetails({
        releaseIds: ["249504"],
        enabled: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.data?.get("249504")?.id).toBe(249504);
    });

    expect(mockApi.discogsReleaseBatch).toHaveBeenCalledTimes(1);
    expect(mockApi.discogsReleaseBatch).toHaveBeenCalledWith(["249504"]);
    expect(mockApi.discogsRelease).not.toHaveBeenCalled();
  });
});
