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
jest.mock("src/lib/welcomeSignupEmail.server", () => ({
  sendWelcomeSignupEmailIfEligible: jest.fn(),
}));
jest.mock("src/lib/sendUserEmailVerification.server", () => ({
  sendUserEmailVerification: jest.fn(),
}));

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
let mockSendWelcomeSignupEmailIfEligible: jest.MockedFunction<
  typeof import("src/lib/welcomeSignupEmail.server")["sendWelcomeSignupEmailIfEligible"]
>;
let mockSendUserEmailVerification: jest.MockedFunction<
  typeof import("src/lib/sendUserEmailVerification.server")["sendUserEmailVerification"]
>;

const USER_ID = 42;
const USERNAME = "crate-digger";

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: USER_ID,
  username: USERNAME,
});

const verifiedContactRow = () =>
  prismaUserFactory.build({
    discogs_user_id: USER_ID,
    email: "dig@example.com",
    email_verified_at: new Date("2026-01-01T00:00:00.000Z"),
    email_pending: null,
    marketing_emails_opt_in: true,
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
  const welcomeEmail = await import("src/lib/welcomeSignupEmail.server");
  mockSendWelcomeSignupEmailIfEligible = jest.mocked(
    welcomeEmail.sendWelcomeSignupEmailIfEligible,
  );
  const verificationEmail = await import(
    "src/lib/sendUserEmailVerification.server"
  );
  mockSendUserEmailVerification = jest.mocked(
    verificationEmail.sendUserEmailVerification,
  );
});

describe("/api/user/contact", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendWelcomeSignupEmailIfEligible.mockResolvedValue(undefined);
    mockSendUserEmailVerification.mockResolvedValue(undefined);
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockFindUnique.mockResolvedValue(verifiedContactRow());
    mockUpsert.mockResolvedValue(verifiedContactRow());
  });

  it("GET returns stored contact without writing", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/user/contact"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      email: "dig@example.com",
      pendingEmail: null,
      emailVerified: true,
      marketingEmailsOptIn: true,
    });
  });

  it("PATCH rejects marketing opt-in without a verified email", async () => {
    mockFindUnique.mockResolvedValue(
      prismaUserFactory.build({
        discogs_user_id: USER_ID,
        email: "dig@example.com",
        email_verified_at: null,
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
      error: "Verify your email before opting in to marketing emails",
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("PATCH starts verification when the email address changes", async () => {
    mockFindUnique.mockResolvedValue(verifiedContactRow());
    mockUpsert.mockResolvedValue(
      prismaUserFactory.build({
        discogs_user_id: USER_ID,
        email: "dig@example.com",
        email_verified_at: null,
        email_pending: "new@example.com",
        marketing_emails_opt_in: false,
      }),
    );

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
        update: expect.objectContaining({
          email_pending: "new@example.com",
          email_verified_at: null,
          marketing_emails_opt_in: false,
          email_verification_token_hash: expect.any(String),
        }),
      }),
    );
    expect(mockSendUserEmailVerification).toHaveBeenCalledWith({
      to: "new@example.com",
      token: expect.any(String),
      siteOrigin: "http://localhost",
    });
    await expect(response.json()).resolves.toEqual({
      email: "dig@example.com",
      pendingEmail: "new@example.com",
      emailVerified: false,
      marketingEmailsOptIn: false,
    });
    expect(mockSendWelcomeSignupEmailIfEligible).not.toHaveBeenCalled();
  });

  it("PATCH resends verification when resendEmailVerification is true", async () => {
    mockFindUnique.mockResolvedValue(
      prismaUserFactory.build({
        discogs_user_id: USER_ID,
        email: "dig@example.com",
        email_verified_at: null,
        email_pending: "new@example.com",
        marketing_emails_opt_in: false,
      }),
    );
    mockUpsert.mockResolvedValue(
      prismaUserFactory.build({
        discogs_user_id: USER_ID,
        email: "dig@example.com",
        email_verified_at: null,
        email_pending: "new@example.com",
        marketing_emails_opt_in: false,
      }),
    );

    const response = await PATCH(
      new NextRequest("http://localhost/api/user/contact", {
        method: "PATCH",
        body: JSON.stringify({ resendEmailVerification: true }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          email_pending: "new@example.com",
          email_verification_token_hash: expect.any(String),
        }),
      }),
    );
    expect(mockSendUserEmailVerification).toHaveBeenCalledWith({
      to: "new@example.com",
      token: expect.any(String),
      siteOrigin: "http://localhost",
    });
  });

  it("PATCH does not promote pending email when resubmitting the same address", async () => {
    mockFindUnique.mockResolvedValue(
      prismaUserFactory.build({
        discogs_user_id: USER_ID,
        email: "dig@example.com",
        email_verified_at: null,
        email_pending: "new@example.com",
        marketing_emails_opt_in: false,
      }),
    );

    const response = await PATCH(
      new NextRequest("http://localhost/api/user/contact", {
        method: "PATCH",
        body: JSON.stringify({ email: "new@example.com" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockSendUserEmailVerification).not.toHaveBeenCalled();
    expect(mockSendWelcomeSignupEmailIfEligible).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      email: "dig@example.com",
      pendingEmail: "new@example.com",
      emailVerified: false,
      marketingEmailsOptIn: false,
    });
  });

  it("PATCH saves marketing opt-in when the email is already verified", async () => {
    mockFindUnique.mockResolvedValue(
      prismaUserFactory.build({
        discogs_user_id: USER_ID,
        email: "dig@example.com",
        email_verified_at: new Date(),
        marketing_emails_opt_in: false,
      }),
    );
    mockUpsert.mockResolvedValue(
      prismaUserFactory.build({
        discogs_user_id: USER_ID,
        email: "dig@example.com",
        email_verified_at: new Date(),
        marketing_emails_opt_in: true,
      }),
    );

    const response = await PATCH(
      new NextRequest("http://localhost/api/user/contact", {
        method: "PATCH",
        body: JSON.stringify({ marketingEmailsOptIn: true }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockSendUserEmailVerification).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      email: "dig@example.com",
      pendingEmail: null,
      emailVerified: true,
      marketingEmailsOptIn: true,
    });
  });
});
