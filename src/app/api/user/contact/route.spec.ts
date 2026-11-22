import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { prismaUserFactory } from "src/tests/factories/User.factory";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";

jest.mock("src/lib/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

jest.mock("src/lib/api-helpers");

type RouteModule = typeof import("src/app/api/user/contact/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type DbModule = typeof import("src/lib/db");

let GET: RouteModule["GET"];
let PATCH: RouteModule["PATCH"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockFindUnique: jest.MockedFunction<
  DbModule["prisma"]["user"]["findUnique"]
>;
let mockUpsert: jest.MockedFunction<DbModule["prisma"]["user"]["upsert"]>;

const USER_ID = 42;
const USERNAME = "crate-digger";

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: USER_ID,
  username: USERNAME,
});

beforeAll(async () => {
  const [routeModule, apiHelpers, db] = await Promise.all([
    import("src/app/api/user/contact/route"),
    import("src/lib/api-helpers"),
    import("src/lib/db"),
  ]);

  GET = routeModule.GET;
  PATCH = routeModule.PATCH;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockFindUnique = jest.mocked(db.prisma.user.findUnique);
  mockUpsert = jest.mocked(db.prisma.user.upsert);
});

describe("/api/user/contact", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockFindUnique.mockResolvedValue(
      prismaUserFactory.build({
        discogs_user_id: USER_ID,
        email: "dig@example.com",
        marketing_emails_opt_in: true,
      }),
    );
    mockUpsert.mockResolvedValue(
      prismaUserFactory.build({
        discogs_user_id: USER_ID,
        email: "dig@example.com",
        marketing_emails_opt_in: true,
      }),
    );
  });

  it("GET returns stored contact without writing", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/user/contact"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      email: "dig@example.com",
      marketingEmailsOptIn: true,
    });
  });

  it("PATCH rejects marketing opt-in without an email", async () => {
    mockFindUnique.mockResolvedValue(
      prismaUserFactory.build({
        discogs_user_id: USER_ID,
        email: null,
        marketing_emails_opt_in: false,
      }),
    );

    const response = await PATCH(
      new NextRequest("http://localhost/api/user/contact", {
        method: "PATCH",
        body: JSON.stringify({ marketingEmailsOptIn: true }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Add an email address before opting in to marketing emails",
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("PATCH saves email and marketing opt-in", async () => {
    const response = await PATCH(
      new NextRequest("http://localhost/api/user/contact", {
        method: "PATCH",
        body: JSON.stringify({
          email: "new@example.com",
          marketingEmailsOptIn: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          email: "new@example.com",
          marketing_emails_opt_in: true,
        }),
        update: expect.objectContaining({
          email: "new@example.com",
          marketing_emails_opt_in: true,
        }),
      }),
    );
    await expect(response.json()).resolves.toEqual({
      email: "new@example.com",
      marketingEmailsOptIn: true,
    });
  });
});
