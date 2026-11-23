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

jest.mock("src/lib/admin-welcome-email-pending.server", () => ({
  listAdminWelcomeEmailPendingUsers: jest.fn(),
}));

type RouteModule =
  typeof import("src/app/api/admin/welcome-email/pending/route");
type AdminHelpersModule = typeof import("src/lib/admin-helpers");
type PendingModule =
  typeof import("src/lib/admin-welcome-email-pending.server");

let GET: RouteModule["GET"];
let mockVerifyAdminFromRequest: jest.MockedFunction<
  AdminHelpersModule["verifyAdminFromRequest"]
>;
let mockListPending: jest.MockedFunction<
  PendingModule["listAdminWelcomeEmailPendingUsers"]
>;

beforeAll(async () => {
  const [routeModule, adminHelpers, pending] = await Promise.all([
    import("src/app/api/admin/welcome-email/pending/route"),
    import("src/lib/admin-helpers"),
    import("src/lib/admin-welcome-email-pending.server"),
  ]);

  GET = routeModule.GET;
  mockVerifyAdminFromRequest = jest.mocked(adminHelpers.verifyAdminFromRequest);
  mockListPending = jest.mocked(pending.listAdminWelcomeEmailPendingUsers);
});

describe("GET /api/admin/welcome-email/pending", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
  });

  it("returns pending welcome email users for admin", async () => {
    mockVerifyAdminFromRequest.mockResolvedValue(true);
    mockListPending.mockResolvedValue([
      {
        discogsUserId: 42,
        username: "crate-digger",
        email: "dig@example.com",
        createdAt: "2026-11-23T12:00:00.000Z",
        loginCount: 1,
      },
    ]);

    const response = await GET(
      new NextRequest("http://localhost/api/admin/welcome-email/pending"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      users: [
        {
          discogsUserId: 42,
          username: "crate-digger",
          email: "dig@example.com",
          createdAt: "2026-11-23T12:00:00.000Z",
          loginCount: 1,
        },
      ],
    });
  });

  it("returns 403 for non-admin users", async () => {
    mockVerifyAdminFromRequest.mockResolvedValue(false);

    const response = await GET(
      new NextRequest("http://localhost/api/admin/welcome-email/pending"),
    );

    expect(response.status).toBe(403);
    expect(mockListPending).not.toHaveBeenCalled();
  });
});
