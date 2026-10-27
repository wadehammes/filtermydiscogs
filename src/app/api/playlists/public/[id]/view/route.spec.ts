import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest } from "next/server";

jest.mock("src/lib/ip-rate-limit", () => ({
  getIpRateLimitResponse: jest.fn(() => null),
  PUBLIC_PLAYLIST_ENGAGEMENT_RATE_LIMIT_CONFIG: {},
}));

jest.mock("src/lib/auth-request", () => ({
  getOptionalVerifiedUserFromRequest: jest.fn(),
}));

jest.mock("src/lib/playlist-engagement.server", () => ({
  getPublicPlaylistShareStats: jest.fn(),
  recordPublicPlaylistView: jest.fn(),
}));

type RouteModule =
  typeof import("src/app/api/playlists/public/[id]/view/route");
type AuthModule = typeof import("src/lib/auth-request");
type EngagementModule = typeof import("src/lib/playlist-engagement.server");

const PUBLIC_PLAYLIST_ID = "11111111-2222-3333-4444-555555555555";

let POST: RouteModule["POST"];
let mockGetOptionalVerifiedUser: jest.MockedFunction<
  AuthModule["getOptionalVerifiedUserFromRequest"]
>;
let mockGetPublicPlaylistShareStats: jest.MockedFunction<
  EngagementModule["getPublicPlaylistShareStats"]
>;
let mockRecordPublicPlaylistView: jest.MockedFunction<
  EngagementModule["recordPublicPlaylistView"]
>;

beforeAll(async () => {
  const [routeModule, authModule, engagementModule] = await Promise.all([
    import("src/app/api/playlists/public/[id]/view/route"),
    import("src/lib/auth-request"),
    import("src/lib/playlist-engagement.server"),
  ]);

  POST = routeModule.POST;
  mockGetOptionalVerifiedUser = jest.mocked(
    authModule.getOptionalVerifiedUserFromRequest,
  );
  mockGetPublicPlaylistShareStats = jest.mocked(
    engagementModule.getPublicPlaylistShareStats,
  );
  mockRecordPublicPlaylistView = jest.mocked(
    engagementModule.recordPublicPlaylistView,
  );
});

describe("POST /api/playlists/public/[id]/view", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOptionalVerifiedUser.mockResolvedValue(null);
  });

  it("returns 400 for an invalid playlist id", async () => {
    const response = await POST(new NextRequest("http://localhost/api"), {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });

    expect(response.status).toBe(400);
  });

  it("records a public playlist view", async () => {
    mockRecordPublicPlaylistView.mockResolvedValue({
      publicViewCount: 3,
      publicPlayCount: 1,
    });

    const response = await POST(
      new NextRequest("http://localhost/api", { method: "POST" }),
      { params: Promise.resolve({ id: PUBLIC_PLAYLIST_ID }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      shareStats: { publicViewCount: 3, publicPlayCount: 1 },
    });
    expect(mockRecordPublicPlaylistView).toHaveBeenCalledWith(
      PUBLIC_PLAYLIST_ID,
      undefined,
    );
    expect(response.cookies.get(`fmd_plv_${PUBLIC_PLAYLIST_ID}`)?.value).toBe(
      "1",
    );
  });

  it("when the view cookie is already set, returns stats without incrementing", async () => {
    mockGetPublicPlaylistShareStats.mockResolvedValue({
      publicViewCount: 9,
      publicPlayCount: 2,
    });

    const response = await POST(
      new NextRequest("http://localhost/api", {
        method: "POST",
        headers: {
          cookie: `fmd_plv_${PUBLIC_PLAYLIST_ID}=1`,
        },
      }),
      { params: Promise.resolve({ id: PUBLIC_PLAYLIST_ID }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      shareStats: { publicViewCount: 9, publicPlayCount: 2 },
      deduped: true,
    });
    expect(mockRecordPublicPlaylistView).not.toHaveBeenCalled();
    expect(mockGetPublicPlaylistShareStats).toHaveBeenCalledWith(
      PUBLIC_PLAYLIST_ID,
    );
  });
});
