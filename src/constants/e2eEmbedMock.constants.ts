export const E2E_EMBED_MOCK_VIDEO_IDS = {
  normal: "e2eNorm0001",
  silent: "e2eSilent01",
  delayed: "e2eDelay000",
  error: "e2eError000",
  embed150: "e2eEmb15000",
} as const;

export type E2eEmbedMockMode =
  | "normal"
  | "silent"
  | "delayed"
  | "error"
  | "embed150";

export const E2E_EMBED_MOCK_DELAYED_PLAYING_MS = 7200;

const VIDEO_ID_TO_MODE: Record<string, E2eEmbedMockMode> = {
  [E2E_EMBED_MOCK_VIDEO_IDS.normal]: "normal",
  [E2E_EMBED_MOCK_VIDEO_IDS.silent]: "silent",
  [E2E_EMBED_MOCK_VIDEO_IDS.delayed]: "delayed",
  [E2E_EMBED_MOCK_VIDEO_IDS.error]: "error",
  [E2E_EMBED_MOCK_VIDEO_IDS.embed150]: "embed150",
};

export const resolveE2eEmbedMockModeForVideoId = (
  videoId: string,
): E2eEmbedMockMode | null => VIDEO_ID_TO_MODE[videoId] ?? null;

export const isE2eHarnessMockVideoId = (videoId: string): boolean => {
  const mode = resolveE2eEmbedMockModeForVideoId(videoId);

  return mode !== null && mode !== "normal";
};

export const appendE2eEmbedMockQueryParams = (
  params: URLSearchParams,
  videoId: string,
): void => {
  const mode = resolveE2eEmbedMockModeForVideoId(videoId);

  if (!mode || mode === "normal") {
    return;
  }

  params.set("mode", mode);

  if (mode === "delayed") {
    params.set("delayMs", String(E2E_EMBED_MOCK_DELAYED_PLAYING_MS));
  }
};
