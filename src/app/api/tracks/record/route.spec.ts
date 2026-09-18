import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { userTrackRecordBodyFactory } from "src/tests/factories/UserTrackRecordBody.factory";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";

jest.mock("src/lib/db", () => ({
  prisma: {
    userTrack: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock("src/lib/user-track.server", () => ({
  recordUserTrackEvent: jest.fn(),
}));

jest.mock("src/lib/api-helpers", () => ({
  getVerifiedUserFromRequestWithRateLimit: jest.fn(),
  createErrorResponse: jest.fn((_error: unknown, message: string) =>
    NextResponse.json({ error: message }, { status: 500 }),
  ),
}));

type RouteModule = typeof import("src/app/api/tracks/record/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type UserTrackServerModule = typeof import("src/lib/user-track.server");

let POST: RouteModule["POST"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockRecordUserTrackEvent: jest.MockedFunction<
  UserTrackServerModule["recordUserTrackEvent"]
>;

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: 42,
});

beforeAll(async () => {
  const [routeModule, apiHelpers, userTrackServer] = await Promise.all([
    import("src/app/api/tracks/record/route"),
    import("src/lib/api-helpers"),
    import("src/lib/user-track.server"),
  ]);

  POST = routeModule.POST;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockRecordUserTrackEvent = jest.mocked(userTrackServer.recordUserTrackEvent);
});

describe("/api/tracks/record", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockRecordUserTrackEvent.mockResolvedValue(undefined);
  });

  it("records a play event for the verified user", async () => {
    const body = userTrackRecordBodyFactory.play();
    const request = new NextRequest("http://localhost/api/tracks/record", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(mockRecordUserTrackEvent).toHaveBeenCalledWith(
      verifiedUser.user.userId,
      body,
    );
  });

  it("returns 400 for invalid body", async () => {
    const request = new NextRequest("http://localhost/api/tracks/record", {
      method: "POST",
      body: JSON.stringify({ event: "play" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mockRecordUserTrackEvent).not.toHaveBeenCalled();
  });
});
