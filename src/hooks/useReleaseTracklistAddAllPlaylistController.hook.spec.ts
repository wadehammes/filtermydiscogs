import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, waitFor } from "@testing-library/react";
import { api } from "src/api/urls";
import { useReleaseTracklistAddAllPlaylistController } from "src/hooks/useReleaseTracklistAddAllPlaylistController.hook";
import { playlistSummaryFactory } from "src/tests/factories/PlaylistSummary.factory";
import { trackMetadataBodyFactory } from "src/tests/factories/TrackMetadataBody.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { renderFeatureHook } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const playlistsApiError = new Error("Playlists API request failed");
const addTrackApiError = new Error("Add track to playlist failed");

const ensurePlaylistApiMocks = () => {
  if (!jest.isMockFunction(mockApi.playlists)) {
    Object.assign(mockApi, { playlists: jest.fn() });
  }

  if (!jest.isMockFunction(mockApi.addTrackToPlaylist)) {
    Object.assign(mockApi, { addTrackToPlaylist: jest.fn() });
  }

  if (!jest.isMockFunction(mockApi.createPlaylist)) {
    Object.assign(mockApi, { createPlaylist: jest.fn() });
  }
};

describe("useReleaseTracklistAddAllPlaylistController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensurePlaylistApiMocks();
    mockApiResponse(true, mockApi.playlists, [], playlistsApiError);
    mockApiResponse(
      true,
      mockApi.addTrackToPlaylist,
      { sort_order: 0 },
      addTrackApiError,
    );
  });

  it("calls addTrackToPlaylist for each metadata row when a playlist is picked", async () => {
    const firstTrack = trackMetadataBodyFactory.opening();
    const secondTrack = trackMetadataBodyFactory.build({
      track_key: "inst:B1",
      track_position: "B1",
    });
    const metadata = [firstTrack, secondTrack];

    const { result } = renderFeatureHook(
      () =>
        useReleaseTracklistAddAllPlaylistController({
          trackMetadataList: metadata,
          releaseTitle: "Test release",
        }),
      { authInitialState: testAuthenticatedAuthState },
    );

    await act(async () => {
      await result.current.submenuPanelProps.onPickPlaylist(
        "pl-1",
        "Sunday",
        false,
      );
    });

    await waitFor(() => {
      expect(mockApi.addTrackToPlaylist).toHaveBeenCalledTimes(2);
    });

    expect(mockApi.addTrackToPlaylist).toHaveBeenNthCalledWith(
      1,
      "pl-1",
      firstTrack,
    );
    expect(mockApi.addTrackToPlaylist).toHaveBeenNthCalledWith(
      2,
      "pl-1",
      secondTrack,
    );
  });

  it("when creating a playlist from the dialog, posts name and publicDescription then adds all tracks", async () => {
    const firstTrack = trackMetadataBodyFactory.opening();
    const secondTrack = trackMetadataBodyFactory.build({
      track_key: "inst:B1",
      track_position: "B1",
    });
    const metadata = [firstTrack, secondTrack];
    const created = playlistSummaryFactory.build({ name: "Full album" });

    mockApiResponse(
      true,
      mockApi.createPlaylist,
      created,
      new Error("Create playlist failed"),
    );
    mockApiResponse(
      [true, true],
      mockApi.addTrackToPlaylist,
      { sort_order: 0 },
      addTrackApiError,
    );

    const { result } = renderFeatureHook(
      () =>
        useReleaseTracklistAddAllPlaylistController({
          trackMetadataList: metadata,
          releaseTitle: "Test release",
        }),
      { authInitialState: testAuthenticatedAuthState },
    );

    await act(async () => {
      await result.current.createDialogProps.onCreate({
        name: "Full album",
        publicDescription: "Every track",
      });
    });

    expect(mockApi.createPlaylist).toHaveBeenCalledWith({
      name: "Full album",
      publicDescription: "Every track",
    });
    expect(mockApi.addTrackToPlaylist).toHaveBeenCalledTimes(2);
    expect(mockApi.addTrackToPlaylist).toHaveBeenNthCalledWith(
      1,
      created.id,
      firstTrack,
    );
    expect(mockApi.addTrackToPlaylist).toHaveBeenNthCalledWith(
      2,
      created.id,
      secondTrack,
    );
    expect(result.current.createDialogProps.isOpen).toBe(false);
  });
});
