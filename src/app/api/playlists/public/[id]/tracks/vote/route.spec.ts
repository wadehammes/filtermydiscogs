import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest } from "next/server";
import { PLAYLIST_TRACK_VOTE_UP } from "src/constants/playlistTrackVote.constants";

jest.mock("src/lib/ip-rate-limit", () => ({
  getIpRateLimitResponse: jest.fn(() => null),
  PUBLIC_PLAYLIST_ENGAGEMENT_RATE_LIMIT_CONFIG: {},
}));

jest.mock("src/lib/auth-request", () => ({
  getOptionalVerifiedUserFromRequest: jest.fn(),
}));

jest.mock("src/lib/playlist-track-vote.server", () => ({
  recordPublicPlaylistTrackVote: jest.fn(),
}));

type RouteModule =
  typeof import("src/app/api/playlists/public/[id]/tracks/vote/route");
type AuthModule = typeof import("src/lib/auth-request");
type VoteModule = typeof import("src/lib/playlist-track-vote.server");

const PUBLIC_PLAYLIST_ID = "11111111-2222-3333-4444-555555555555";

let POST: RouteModule["POST"];
let mockGetOptionalVerifiedUser: jest.MockedFunction<
  AuthModule["getOptionalVerifiedUserFromRequest"]
>;
let mockRecordPublicPlaylistTrackVote: jest.MockedFunction<
  VoteModule["recordPublicPlaylistTrackVote"]
>;

beforeAll(async () => {
  const [routeModule, authModule, voteModule] = await Promise.all([
    import("src/app/api/playlists/public/[id]/tracks/vote/route"),
    import("src/lib/auth-request"),
    import("src/lib/playlist-track-vote.server"),
  ]);

  POST = routeModule.POST;
  mockGetOptionalVerifiedUser = jest.mocked(
    authModule.getOptionalVerifiedUserFromRequest,
  );
  mockRecordPublicPlaylistTrackVote = jest.mocked(
    voteModule.recordPublicPlaylistTrackVote,
  );
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetOptionalVerifiedUser.mockResolvedValue(null);
});

describe("POST /api/playlists/public/[id]/tracks/vote", () => {
  it("records an up vote and returns updated counts", async () => {
    mockRecordPublicPlaylistTrackVote.mockResolvedValue({
      track_key: "9001:A1",
      upCount: 2,
      downCount: 0,
      viewerVote: PLAYLIST_TRACK_VOTE_UP,
    });

    const request = new NextRequest(
      `http://localhost/api/playlists/public/${PUBLIC_PLAYLIST_ID}/tracks/vote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track_key: "9001:A1",
          vote: PLAYLIST_TRACK_VOTE_UP,
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: PUBLIC_PLAYLIST_ID }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      ok: true,
      track_key: "9001:A1",
      upCount: 2,
      downCount: 0,
      viewerVote: PLAYLIST_TRACK_VOTE_UP,
    });
    expect(mockRecordPublicPlaylistTrackVote).toHaveBeenCalledWith(
      expect.objectContaining({
        playlistId: PUBLIC_PLAYLIST_ID,
        trackKey: "9001:A1",
        viewerUserId: null,
      }),
    );
  });

  it("returns 404 when the playlist or track is missing", async () => {
    mockRecordPublicPlaylistTrackVote.mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost/api/playlists/public/${PUBLIC_PLAYLIST_ID}/tracks/vote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track_key: "missing:A1",
          vote: PLAYLIST_TRACK_VOTE_UP,
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: PUBLIC_PLAYLIST_ID }),
    });

    expect(response.status).toBe(404);
  });
});
