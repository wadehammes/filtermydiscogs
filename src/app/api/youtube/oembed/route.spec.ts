import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest } from "next/server";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";

jest.mock("src/lib/youtube-oembed.server", () => ({
  fetchYoutubeOembedMetadata: jest.fn(),
}));

jest.mock("src/lib/api-helpers");

type RouteModule = typeof import("src/app/api/youtube/oembed/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type YoutubeOembedModule = typeof import("src/lib/youtube-oembed.server");

let GET: RouteModule["GET"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockFetchOembed: jest.MockedFunction<
  YoutubeOembedModule["fetchYoutubeOembedMetadata"]
>;

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: 42,
});

beforeAll(async () => {
  const [routeModule, apiHelpers, oembedServer] = await Promise.all([
    import("src/app/api/youtube/oembed/route"),
    import("src/lib/api-helpers"),
    import("src/lib/youtube-oembed.server"),
  ]);

  GET = routeModule.GET;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockFetchOembed = jest.mocked(oembedServer.fetchYoutubeOembedMetadata);
});

describe("GET /api/youtube/oembed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
  });

  it("returns oEmbed metadata for a valid video id", async () => {
    mockFetchOembed.mockResolvedValue({
      title: "Track video",
      authorName: "Channel",
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/youtube/oembed?video_id=dQw4w9WgXcQ",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      title: "Track video",
      authorName: "Channel",
    });
    expect(mockFetchOembed).toHaveBeenCalledWith("dQw4w9WgXcQ");
  });

  it("returns 404 when oEmbed has no metadata", async () => {
    mockFetchOembed.mockResolvedValue(null);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/youtube/oembed?video_id=dQw4w9WgXcQ",
      ),
    );

    expect(response.status).toBe(404);
  });

  it("returns 400 for an invalid video id", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/youtube/oembed?video_id=not-valid"),
    );

    expect(response.status).toBe(400);
    expect(mockFetchOembed).not.toHaveBeenCalled();
  });
});
