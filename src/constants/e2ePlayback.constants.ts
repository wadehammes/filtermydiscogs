export const E2E_MOCK_YOUTUBE_EMBED_PATH = "/e2e/youtube-embed-mock.html";

export const isE2eMockYoutubeEmbedEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED === "1";
