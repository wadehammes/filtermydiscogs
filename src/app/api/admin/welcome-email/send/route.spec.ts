import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";

jest.mock("src/lib/admin-helpers", () => ({
  verifyAdminFromRequest: jest.fn(),
}));

jest.mock("src/lib/admin-welcome-email-pending.server", () => {
  const actual = jest.requireActual<
    typeof import("src/lib/admin-welcome-email-pending.server")
  >("src/lib/admin-welcome-email-pending.server");
  return {
    ...actual,
    sendAdminWelcomeEmailForUser: jest.fn(),
  };
});

type RouteModule = typeof import("src/app/api/admin/welcome-email/send/route");
type AdminHelpersModule = typeof import("src/lib/admin-helpers");
type PendingModule =
  typeof import("src/lib/admin-welcome-email-pending.server");

let POST: RouteModule["POST"];
let mockVerifyAdminFromRequest: jest.MockedFunction<
  AdminHelpersModule["verifyAdminFromRequest"]
>;
let mockSend: jest.MockedFunction<
  PendingModule["sendAdminWelcomeEmailForUser"]
>;
let AdminWelcomeEmailSendFailedError: typeof import("src/lib/admin-welcome-email-pending.server")["AdminWelcomeEmailSendFailedError"];

beforeAll(async () => {
  const [routeModule, adminHelpers, pending] = await Promise.all([
    import("src/app/api/admin/welcome-email/send/route"),
    import("src/lib/admin-helpers"),
    import("src/lib/admin-welcome-email-pending.server"),
  ]);

  POST = routeModule.POST;
  mockVerifyAdminFromRequest = jest.mocked(adminHelpers.verifyAdminFromRequest);
  mockSend = jest.mocked(pending.sendAdminWelcomeEmailForUser);
  AdminWelcomeEmailSendFailedError = pending.AdminWelcomeEmailSendFailedError;
});

describe("POST /api/admin/welcome-email/send", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
  });

  it("sends welcome email for admin", async () => {
    mockVerifyAdminFromRequest.mockResolvedValue(true);
    mockSend.mockResolvedValue(undefined);

    const response = await POST(
      new NextRequest("http://localhost/api/admin/welcome-email/send", {
        method: "POST",
        body: JSON.stringify({ discogsUserId: 42 }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: true,
      discogsUserId: 42,
    });
    expect(mockSend).toHaveBeenCalledWith(42);
  });

  it("returns 422 when send helper rejects", async () => {
    mockVerifyAdminFromRequest.mockResolvedValue(true);
    mockSend.mockRejectedValue(
      new AdminWelcomeEmailSendFailedError("Welcome email was not sent"),
    );

    const response = await POST(
      new NextRequest("http://localhost/api/admin/welcome-email/send", {
        method: "POST",
        body: JSON.stringify({ discogsUserId: 42 }),
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Welcome email was not sent",
    });
  });

  it("returns 403 for non-admin users", async () => {
    mockVerifyAdminFromRequest.mockResolvedValue(false);

    const response = await POST(
      new NextRequest("http://localhost/api/admin/welcome-email/send", {
        method: "POST",
        body: JSON.stringify({ discogsUserId: 42 }),
      }),
    );

    expect(response.status).toBe(403);
    expect(mockSend).not.toHaveBeenCalled();
  });
});
