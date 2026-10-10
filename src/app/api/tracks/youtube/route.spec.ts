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
  saveUserTrackYoutubeOverride: jest.fn(),
}));

jest.mock("src/lib/api-helpers");

type RouteModule = typeof import("src/app/api/tracks/youtube/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type UserTrackServerModule = typeof import("src/lib/user-track.server");

let PATCH: RouteModule["PATCH"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockSaveOverride: jest.MockedFunction<
  UserTrackServerModule["saveUserTrackYoutubeOverride"]
>;

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: 42,
});

beforeAll(async () => {
  const [routeModule, apiHelpers, userTrackServer] = await Promise.all([
    import("src/app/api/tracks/youtube/route"),
    import("src/lib/api-helpers"),
    import("src/lib/user-track.server"),
  ]);

  PATCH = routeModule.PATCH;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockSaveOverride = jest.mocked(userTrackServer.saveUserTrackYoutubeOverride);
});

describe("/api/tracks/youtube", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockSaveOverride.mockResolvedValue(undefined);
  });

  it("saves a user YouTube override for a track without a Discogs embed", async () => {
    const request = new NextRequest("http://localhost/api/tracks/youtube", {
      method: "PATCH",
      body: JSON.stringify({
        track_key: "modal-release-instance:A2",
        track_title: "Modal Track Two",
        track_position: "A2",
        instance_id: "modal-release-instance",
        youtube_id: "dQw4w9WgXcQ",
        artist: "Rick Astley",
        release_title: "Other Album",
      }),
    });

    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockSaveOverride).toHaveBeenCalledWith(verifiedUser.user.userId, {
      track_key: "modal-release-instance:A2",
      track_title: "Modal Track Two",
      track_position: "A2",
      instance_id: "modal-release-instance",
      youtube_id: "dQw4w9WgXcQ",
      artist: "Rick Astley",
      release_title: "Other Album",
    });
    expect(json).toEqual({ ok: true });
  });

  it("saves a user YouTube override for a track", async () => {
    const request = new NextRequest("http://localhost/api/tracks/youtube", {
      method: "PATCH",
      body: JSON.stringify({
        track_key: "inst-1:A1",
        track_title: "Track One",
        track_position: "A1",
        instance_id: "inst-1",
        youtube_id: "dQw4w9WgXcQ",
        artist: "Artist",
        release_title: "Album",
      }),
    });

    const response = await PATCH(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockSaveOverride).toHaveBeenCalledWith(verifiedUser.user.userId, {
      track_key: "inst-1:A1",
      track_title: "Track One",
      track_position: "A1",
      instance_id: "inst-1",
      youtube_id: "dQw4w9WgXcQ",
      artist: "Artist",
      release_title: "Album",
    });
    expect(json).toEqual({ ok: true });
  });

  it("clears a user YouTube override when youtube_id is null", async () => {
    const request = new NextRequest("http://localhost/api/tracks/youtube", {
      method: "PATCH",
      body: JSON.stringify({
        track_key: "inst-1:A1",
        track_title: "Track One",
        track_position: "A1",
        instance_id: "inst-1",
        youtube_id: null,
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(mockSaveOverride).toHaveBeenCalledWith(verifiedUser.user.userId, {
      track_key: "inst-1:A1",
      track_title: "Track One",
      track_position: "A1",
      instance_id: "inst-1",
      youtube_id: null,
    });
  });

  it("returns 400 for an invalid YouTube id", async () => {
    const request = new NextRequest("http://localhost/api/tracks/youtube", {
      method: "PATCH",
      body: JSON.stringify({
        track_key: "inst-1:A1",
        track_title: "Track One",
        track_position: "A1",
        instance_id: "inst-1",
        youtube_id: "not-valid",
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);
    expect(mockSaveOverride).not.toHaveBeenCalled();
  });
});
