export const E2E_MOCK_YOUTUBE_EMBED_PATH = "/e2e/youtube-embed-mock.html";

import { isE2eHarnessMockVideoId } from "src/constants/e2eEmbedMock.constants";

export const isE2eMockYoutubeEmbedEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED === "1";

export const shouldUseE2eMockYoutubeEmbedForVideo = (
  videoId: string,
): boolean =>
  isE2eMockYoutubeEmbedEnabled() || isE2eHarnessMockVideoId(videoId);
