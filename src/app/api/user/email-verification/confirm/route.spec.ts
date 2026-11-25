import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest } from "next/server";

jest.mock("src/lib/applyUserEmailVerification.server", () => ({
  applyUserEmailVerificationToken: jest.fn(),
}));

jest.mock("src/lib/api-helpers");

type RouteModule =
  typeof import("src/app/api/user/email-verification/confirm/route");

let GET: RouteModule["GET"];
let mockApplyUserEmailVerificationToken: jest.MockedFunction<
  typeof import("src/lib/applyUserEmailVerification.server")["applyUserEmailVerificationToken"]
>;

beforeAll(async () => {
  const routeModule = await import(
    "src/app/api/user/email-verification/confirm/route"
  );
  GET = routeModule.GET;
  const applyModule = await import("src/lib/applyUserEmailVerification.server");
  mockApplyUserEmailVerificationToken = jest.mocked(
    applyModule.applyUserEmailVerificationToken,
  );
});

describe("/api/user/email-verification/confirm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to settings when verification succeeds", async () => {
    mockApplyUserEmailVerificationToken.mockResolvedValue({
      ok: true,
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/user/email-verification/confirm?token=abc",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/settings?section=account&emailVerification=success",
    );
  });

  it("redirects with an expired status when the token is no longer valid", async () => {
    mockApplyUserEmailVerificationToken.mockResolvedValue({
      ok: false,
      reason: "expired",
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/user/email-verification/confirm?token=abc",
      ),
    );

    expect(response.headers.get("location")).toMatch(
      /emailVerification=expired/,
    );
  });
});
