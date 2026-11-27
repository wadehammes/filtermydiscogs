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

jest.mock("src/lib/api-helpers");

const mockSendBugReportNotificationEmails =
  jest.fn<
    (input: {
      message: string;
      feedbackSourceTag?: string;
      reporterEmail?: string;
      reporterName?: string;
      username?: string;
      discogsUserId?: string;
    }) => Promise<void>
  >();

jest.mock("src/lib/sendBugReportNotificationEmails.server", () => ({
  sendBugReportNotificationEmails: mockSendBugReportNotificationEmails,
}));

const mockResolveBugReportReporterContact =
  jest.fn<() => Promise<{ reporterEmail?: string; reporterName?: string }>>();

jest.mock("src/lib/resolveBugReportReporterContact.server", () => ({
  resolveBugReportReporterContact: mockResolveBugReportReporterContact,
}));

type RouteModule =
  typeof import("src/app/api/user/bug-report-notification/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");

let POST: RouteModule["POST"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: 99,
  username: "wax-head",
});

beforeAll(async () => {
  const [routeModule, apiHelpers] = await Promise.all([
    import("src/app/api/user/bug-report-notification/route"),
    import("src/lib/api-helpers"),
  ]);

  POST = routeModule.POST;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
});

describe("POST /api/user/bug-report-notification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendBugReportNotificationEmails.mockResolvedValue(undefined);
    mockResolveBugReportReporterContact.mockResolvedValue({
      reporterEmail: "wax@example.com",
      reporterName: "Wax",
    });
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
  });

  it("returns 401 when the session is not verified", async () => {
    mockGetVerifiedUser.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await POST(
      new NextRequest("http://localhost/api/user/bug-report-notification", {
        method: "POST",
        body: JSON.stringify({ message: "Broken filters" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(mockSendBugReportNotificationEmails).not.toHaveBeenCalled();
  });

  it("enqueues support and receipt emails when the body is valid", async () => {
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);

    const response = await POST(
      new NextRequest("http://localhost/api/user/bug-report-notification", {
        method: "POST",
        body: JSON.stringify({
          message: "Palette preview looks wrong",
          feedbackSourceTag: "collection_command",
          email: "wax@example.com",
          name: "Wax",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockSendBugReportNotificationEmails).toHaveBeenCalledWith({
      message: "Palette preview looks wrong",
      feedbackSourceTag: "collection_command",
      reporterEmail: "wax@example.com",
      reporterName: "Wax",
      username: "wax-head",
      discogsUserId: "99",
    });
  });
});
