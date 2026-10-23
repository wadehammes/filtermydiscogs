import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, waitFor } from "@testing-library/react";
import { api } from "src/api/urls";
import { useReleasePlaylistPickerController } from "src/hooks/useReleasePlaylistPickerController.hook";
import { trackMetadataBodyFactory } from "src/tests/factories/TrackMetadataBody.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { renderFeatureHook } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const playlistsApiError = new Error("Playlists API request failed");

describe("useReleasePlaylistPickerController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (!jest.isMockFunction(mockApi.playlists)) {
      Object.assign(mockApi, { playlists: jest.fn() });
    }
    mockApiResponse(true, mockApi.playlists, [], playlistsApiError);
  });

  it("when mounted with authenticated user, loads playlists with metadata track_key for membership", async () => {
    const metadata = trackMetadataBodyFactory.opening();

    renderFeatureHook(
      () =>
        useReleasePlaylistPickerController({
          metadata,
          trackTitle: "Opening",
        }),
      { authInitialState: testAuthenticatedAuthState },
    );

    await waitFor(() => {
      expect(mockApi.playlists).toHaveBeenCalledWith({
        trackKey: metadata.track_key,
      });
    });
  });

  it("when opening the create playlist dialog, calls onRequestCloseMenu", () => {
    const onRequestCloseMenu = jest.fn();
    const metadata = trackMetadataBodyFactory.opening();

    const { result } = renderFeatureHook(() =>
      useReleasePlaylistPickerController({
        metadata,
        trackTitle: "Opening",
        onRequestCloseMenu,
      }),
    );

    act(() => {
      result.current.submenuPanelProps?.onOpenCreateDialog();
    });

    expect(onRequestCloseMenu).toHaveBeenCalledTimes(1);
    expect(result.current.createDialogProps.isOpen).toBe(true);
  });

  it("when picking a playlist that already contains the track, removes the track", async () => {
    if (!jest.isMockFunction(mockApi.addTrackToPlaylist)) {
      Object.assign(mockApi, { addTrackToPlaylist: jest.fn() });
    }
    if (!jest.isMockFunction(mockApi.removeTrackFromPlaylist)) {
      Object.assign(mockApi, { removeTrackFromPlaylist: jest.fn() });
    }
    mockApiResponse(
      true,
      mockApi.removeTrackFromPlaylist,
      undefined,
      new Error("Remove track from playlist failed"),
    );

    const metadata = trackMetadataBodyFactory.opening();

    const { result } = renderFeatureHook(
      () =>
        useReleasePlaylistPickerController({
          metadata,
          trackTitle: "Opening",
        }),
      { authInitialState: testAuthenticatedAuthState },
    );

    await act(async () => {
      await result.current.submenuPanelProps.onPickPlaylist(
        "pl-in",
        "Testing",
        true,
      );
    });

    expect(mockApi.removeTrackFromPlaylist).toHaveBeenCalledWith(
      "pl-in",
      metadata.track_key,
    );
    expect(mockApi.addTrackToPlaylist).not.toHaveBeenCalled();
  });
});
