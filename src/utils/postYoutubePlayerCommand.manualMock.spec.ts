import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("src/utils/postYoutubePlayerCommand");

type PostYoutubePlayerCommandMock = {
  requestYoutubeEmbedPlaybackSync: jest.Mock;
  syncYoutubeEmbedPlaybackProgress: (iframe: HTMLIFrameElement | null) => void;
};

const loadPostYoutubePlayerCommandMock = (): PostYoutubePlayerCommandMock =>
  jest.requireMock(
    "src/utils/postYoutubePlayerCommand",
  ) as PostYoutubePlayerCommandMock;

describe("postYoutubePlayerCommand manual mock", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("forwards syncYoutubeEmbedPlaybackProgress after resetAllMocks", () => {
    const {
      requestYoutubeEmbedPlaybackSync,
      syncYoutubeEmbedPlaybackProgress,
    } = loadPostYoutubePlayerCommandMock();
    const iframe = {} as HTMLIFrameElement;

    syncYoutubeEmbedPlaybackProgress(iframe);

    expect(requestYoutubeEmbedPlaybackSync).toHaveBeenCalledWith(iframe);
  });
});
