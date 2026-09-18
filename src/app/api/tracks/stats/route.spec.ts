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
  fetchUserTrackStats: jest.fn(),
}));

jest.mock("src/lib/api-helpers", () => ({
  getVerifiedUserFromRequestWithRateLimit: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/tracks/stats/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type UserTrackServerModule = typeof import("src/lib/user-track.server");

let GET: RouteModule["GET"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockFetchUserTrackStats: jest.MockedFunction<
  UserTrackServerModule["fetchUserTrackStats"]
>;

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: 42,
});

beforeAll(async () => {
  const [routeModule, apiHelpers, userTrackServer] = await Promise.all([
    import("src/app/api/tracks/stats/route"),
    import("src/lib/api-helpers"),
    import("src/lib/user-track.server"),
  ]);

  GET = routeModule.GET;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockFetchUserTrackStats = jest.mocked(userTrackServer.fetchUserTrackStats);
});

describe("/api/tracks/stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockFetchUserTrackStats.mockResolvedValue({
      "1:A": { play_count: 2, listen_count: 1 },
      "1:B": { play_count: 0, listen_count: 0 },
    });
  });

  it("returns stats for requested track keys", async () => {
    const request = new NextRequest(
      "http://localhost/api/tracks/stats?keys=1%3AA,1%3AB",
    );

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockFetchUserTrackStats).toHaveBeenCalledWith(
      verifiedUser.user.userId,
      ["1:A", "1:B"],
    );
    expect(json.stats).toEqual({
      "1:A": { play_count: 2, listen_count: 1 },
      "1:B": { play_count: 0, listen_count: 0 },
    });
  });
});
