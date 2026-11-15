import { describe, expect, it } from "@jest/globals";
import { NextRequest } from "next/server";
import { buildImageProxyCorsHeaders } from "src/lib/image-proxy-cors.server";

describe("image-proxy-cors.server", () => {
  it("omits CORS headers for cross-origin requests", () => {
    const request = new NextRequest("http://localhost/api/image-proxy", {
      headers: { origin: "https://evil.example" },
    });

    expect(buildImageProxyCorsHeaders(request)).toEqual({});
  });

  it("reflects the site origin for same-origin browser requests", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.filtermydisco.gs";
    const request = new NextRequest("http://localhost/api/image-proxy", {
      headers: { origin: "https://www.filtermydisco.gs" },
    });

    expect(buildImageProxyCorsHeaders(request)).toEqual({
      "Access-Control-Allow-Origin": "https://www.filtermydisco.gs",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    });
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });
});
