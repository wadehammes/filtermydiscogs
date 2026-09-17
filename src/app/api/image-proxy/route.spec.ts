import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";

const mockToBuffer = jest.fn<() => Promise<Buffer>>();
const mockJpeg = jest.fn(() => ({ toBuffer: mockToBuffer }));
const mockPng = jest.fn(() => ({ toBuffer: mockToBuffer }));
const mockResize = jest.fn(function (this: unknown) {
  return this;
});
const mockSharp = jest.fn(() => ({
  resize: mockResize,
  jpeg: mockJpeg,
  png: mockPng,
}));

jest.mock("sharp", () => ({
  __esModule: true,
  default: mockSharp,
}));

jest.mock("src/lib/ip-rate-limit", () => ({
  IMAGE_PROXY_RATE_LIMIT_CONFIG: {},
  checkIpRateLimit: jest.fn(() => ({ allowed: true as const })),
}));

jest.mock("src/lib/rethrowNextInternalError", () => ({
  rethrowNextInternalError: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/image-proxy/route");
type IpRateLimitModule = typeof import("src/lib/ip-rate-limit");

let GET: RouteModule["GET"];
let mockCheckIpRateLimit: jest.MockedFunction<
  IpRateLimitModule["checkIpRateLimit"]
>;

const DISCOGS_IMAGE_URL = "https://i.discogs.com/example-cover.jpeg";

const createRequest = (search: string) =>
  new NextRequest(`http://localhost/api/image-proxy?${search}`);

const createFetchResponse = ({
  ok = true,
  status = 200,
  body = Uint8Array.from([0xff, 0xd8, 0xff]).buffer,
  contentLength,
}: {
  ok?: boolean;
  status?: number;
  body?: ArrayBuffer;
  contentLength?: string;
} = {}) => {
  const headers = new Headers();

  if (contentLength !== undefined) {
    headers.set("content-length", contentLength);
  }

  headers.set("content-type", "image/jpeg");

  return {
    ok,
    status,
    headers,
    arrayBuffer: async () => body,
  } as Response;
};

beforeAll(async () => {
  const [routeModule, ipRateLimit] = await Promise.all([
    import("src/app/api/image-proxy/route"),
    import("src/lib/ip-rate-limit"),
  ]);

  GET = routeModule.GET;
  mockCheckIpRateLimit = jest.mocked(ipRateLimit.checkIpRateLimit);
});

describe("GET /api/image-proxy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockCheckIpRateLimit.mockReturnValue({ allowed: true });
    mockToBuffer.mockResolvedValue(Buffer.from("optimized-image"));
    global.fetch = jest.fn() as typeof fetch;
  });

  it("returns 400 when url is missing", async () => {
    const response = await GET(createRequest("w=100&h=100"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Missing image URL" });
  });

  it("returns 400 for a non-Discogs image source", async () => {
    const response = await GET(
      createRequest(
        `url=${encodeURIComponent("https://example.com/image.jpg")}`,
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid image source" });
  });

  it("returns 429 when rate limited", async () => {
    mockCheckIpRateLimit.mockReturnValue({
      allowed: false,
      response: NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      ),
    });

    const response = await GET(
      createRequest(`url=${encodeURIComponent(DISCOGS_IMAGE_URL)}`),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({ error: "Rate limit exceeded" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns upstream status when Discogs fetch fails", async () => {
    jest
      .mocked(global.fetch)
      .mockResolvedValue(createFetchResponse({ ok: false, status: 404 }));

    const response = await GET(
      createRequest(`url=${encodeURIComponent(DISCOGS_IMAGE_URL)}`),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Failed to fetch image" });
  });

  it("returns 413 when content-length exceeds the limit", async () => {
    jest.mocked(global.fetch).mockResolvedValue(
      createFetchResponse({
        contentLength: String(11 * 1024 * 1024),
      }),
    );

    const response = await GET(
      createRequest(`url=${encodeURIComponent(DISCOGS_IMAGE_URL)}`),
    );
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toEqual({ error: "Image file too large" });
  });

  it("returns optimized JPEG with cache headers on success", async () => {
    jest.mocked(global.fetch).mockResolvedValue(createFetchResponse());

    const response = await GET(
      createRequest(
        `url=${encodeURIComponent(DISCOGS_IMAGE_URL)}&w=200&h=200&q=80`,
      ),
    );
    const body = await response.arrayBuffer();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("Cache-Control")).toContain("max-age=86400");
    expect(Buffer.from(body).toString()).toBe("optimized-image");
    expect(mockSharp).toHaveBeenCalled();
    expect(mockResize).toHaveBeenCalled();
    expect(mockJpeg).toHaveBeenCalled();
  });
});
