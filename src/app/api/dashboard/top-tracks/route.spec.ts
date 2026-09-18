import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";

jest.mock("src/lib/user-track.server", () => ({
  fetchTopUserTracks: jest.fn(),
}));

jest.mock("src/lib/api-helpers", () => ({
  getVerifiedUserFromRequestWithRateLimit: jest.fn(),
  sanitizeError: jest.fn((error: unknown) => ({
    status: error instanceof Error ? 500 : 500,
  })),
  rethrowNextInternalError: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/dashboard/top-tracks/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type UserTrackServerModule = typeof import("src/lib/user-track.server");

let GET: RouteModule["GET"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockFetchTopUserTracks: jest.MockedFunction<
  UserTrackServerModule["fetchTopUserTracks"]
>;

const USER_ID = 42;

const createRequest = (limit?: number) => {
  const params = limit !== undefined ? `?limit=${limit}` : "";

  return new NextRequest(`http://localhost/api/dashboard/top-tracks${params}`);
};

beforeAll(async () => {
  const [routeModule, apiHelpers, userTrackServer] = await Promise.all([
    import("src/app/api/dashboard/top-tracks/route"),
    import("src/lib/api-helpers"),
    import("src/lib/user-track.server"),
  ]);

  GET = routeModule.GET;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockFetchTopUserTracks = jest.mocked(userTrackServer.fetchTopUserTracks);
});

describe("GET /api/dashboard/top-tracks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(
      verifiedDiscogsUserFactory.asVerifiedResult({
        userId: USER_ID,
        username: "listener",
      }),
    );
  });

  it("returns most played and most listened lists for the authenticated user", async () => {
    const payload = {
      most_played: [
        {
          track_key: "1:A1",
          instance_id: "1",
          track_title: "Track One",
          track_position: "A1",
          artist: "Artist",
          release_title: "Album",
          release_thumb: null,
          play_count: 5,
          listen_count: 2,
        },
      ],
      most_listened: [],
    };
    mockFetchTopUserTracks.mockResolvedValue(payload);

    const response = await GET(createRequest(5));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(payload);
    expect(mockFetchTopUserTracks).toHaveBeenCalledWith(USER_ID, 5);
  });

  it("returns auth error when verification fails", async () => {
    const authError = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
    mockGetVerifiedUser.mockResolvedValue({ error: authError });

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    expect(mockFetchTopUserTracks).not.toHaveBeenCalled();
  });
});
