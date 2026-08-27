import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextResponse } from "next/server";

jest.mock("src/utils/appBuildVersion", () => ({
  getAppBuildVersion: jest.fn(() => "server-build-version"),
}));

type RouteModule = typeof import("src/app/api/build-version/route");
type AppBuildVersionModule = typeof import("src/utils/appBuildVersion");

let GET: RouteModule["GET"];
let mockGetAppBuildVersion: jest.MockedFunction<
  AppBuildVersionModule["getAppBuildVersion"]
>;

beforeAll(async () => {
  const [routeModule, appBuildVersionModule] = await Promise.all([
    import("src/app/api/build-version/route"),
    import("src/utils/appBuildVersion"),
  ]);

  GET = routeModule.GET;
  mockGetAppBuildVersion = jest.mocked(
    appBuildVersionModule.getAppBuildVersion,
  );
});

describe("GET /api/build-version", () => {
  beforeEach(() => {
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
  });

  it("returns the current build version without caching", async () => {
    mockGetAppBuildVersion.mockReturnValue("abc123");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ version: "abc123" });
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });
});
