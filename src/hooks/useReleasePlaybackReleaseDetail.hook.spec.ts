import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { api } from "src/api/urls";
import { useReleasePlaybackReleaseDetail } from "src/hooks/useReleasePlaybackReleaseDetail.hook";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const RELEASE_ID = 9001;

describe("useReleasePlaybackReleaseDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (!jest.isMockFunction(mockApi.discogsRelease)) {
      Object.assign(mockApi, {
        discogsRelease: jest.fn(),
      });
    }
    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: RELEASE_ID }),
    );
  });

  it("does not fetch release detail when transport is idle", () => {
    const release = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({ id: RELEASE_ID }),
    });
    const tracksRef = { current: [] as never[] };
    const videosRef = { current: [] as never[] };
    const releaseDetailIdRef = { current: undefined as number | undefined };

    renderFeatureHook(() =>
      useReleasePlaybackReleaseDetail({
        release,
        isPlaying: false,
        tracksRef,
        videosRef,
        releaseDetailIdRef,
      }),
    );

    expect(mockApi.discogsRelease).not.toHaveBeenCalled();
    expect(releaseDetailIdRef.current).toBeUndefined();
  });

  it("fetches detail while playing and syncs refs from release detail", async () => {
    const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: RELEASE_ID,
    });
    setupFetchDiscogsReleaseMock(mockApi, releaseDetail);

    const release = releaseFactory.withDisplayDefaults({
      basic_information: basicInformationFactory.build({ id: RELEASE_ID }),
    });
    const tracksRef = { current: [] as never[] };
    const videosRef = { current: [] as never[] };
    const releaseDetailIdRef = { current: undefined as number | undefined };

    const { result } = renderFeatureHook(() =>
      useReleasePlaybackReleaseDetail({
        release,
        isPlaying: true,
        tracksRef,
        videosRef,
        releaseDetailIdRef,
      }),
    );

    await waitFor(() => {
      expect(result.current.tracks.length).toBeGreaterThan(0);
    });

    expect(mockApi.discogsRelease).toHaveBeenCalledWith(String(RELEASE_ID));
    expect(result.current.releaseId).toBe(RELEASE_ID);
    expect(result.current.releaseDetailId).toBe(RELEASE_ID);
    expect(tracksRef.current).toEqual(result.current.tracks);
    expect(videosRef.current).toEqual(result.current.videos);
    expect(releaseDetailIdRef.current).toBe(RELEASE_ID);
    expect(result.current.playbackMatchIndex.hasPlayableTracks).toBe(true);
  });
});
