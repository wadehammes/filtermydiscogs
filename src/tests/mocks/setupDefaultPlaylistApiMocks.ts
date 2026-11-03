import type { Api } from "src/api/urls";
import { api } from "src/api/urls";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";

const playlistsApiError = new Error("Playlists API request failed");

export const setupDefaultPlaylistApiMocks = (
  mockApi: jest.Mocked<Api> = jest.mocked(api),
): void => {
  if (!jest.isMockFunction(mockApi.playlists)) {
    return;
  }

  mockApiResponse(true, mockApi.playlists, [], playlistsApiError);
};
