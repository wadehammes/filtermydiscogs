import { describe, expect, it, jest } from "@jest/globals";
import {
  buildDiscogsImageProxySearchParams,
  fetchDiscogsCdnImage,
  isSafeDiscogsResourcePath,
  parseAllowedDiscogsImageUrl,
  resolveImageProxyFetchTarget,
} from "./discogs-image-proxy-url";

describe("parseAllowedDiscogsImageUrl", () => {
  it("accepts https Discogs CDN hosts", () => {
    const url = parseAllowedDiscogsImageUrl(
      "https://i.discogs.com/example-cover.jpeg",
    );

    expect(url?.href).toBe("https://i.discogs.com/example-cover.jpeg");
  });

  it("accepts img.discogs.com", () => {
    expect(
      parseAllowedDiscogsImageUrl("https://img.discogs.com/x.jpg")?.hostname,
    ).toBe("img.discogs.com");
  });

  it("rejects non-Discogs hosts", () => {
    expect(
      parseAllowedDiscogsImageUrl("https://example.com/image.jpg"),
    ).toBeNull();
  });

  it("rejects lookalike hostnames", () => {
    expect(
      parseAllowedDiscogsImageUrl("https://i.discogs.com.evil.com/x.jpg"),
    ).toBeNull();
  });

  it("rejects non-https", () => {
    expect(
      parseAllowedDiscogsImageUrl("http://i.discogs.com/x.jpg"),
    ).toBeNull();
  });

  it("rejects path traversal in the resource path", () => {
    expect(
      parseAllowedDiscogsImageUrl("https://i.discogs.com/../etc/passwd"),
    ).toBeNull();
  });
});

describe("resolveImageProxyFetchTarget", () => {
  it("resolves cdn and path query params", () => {
    const target = resolveImageProxyFetchTarget(
      new URLSearchParams({
        cdn: "i",
        path: "/example-cover.jpeg",
      }),
    );

    expect(target).toEqual({ cdn: "i", path: "/example-cover.jpeg" });
  });

  it("resolves legacy url query param into cdn and path", () => {
    const target = resolveImageProxyFetchTarget(
      new URLSearchParams({
        url: "https://img.discogs.com/x.jpg",
      }),
    );

    expect(target).toEqual({ cdn: "img", path: "/x.jpg" });
  });

  it("rejects unsafe paths", () => {
    expect(
      resolveImageProxyFetchTarget(
        new URLSearchParams({ cdn: "i", path: "/../secret" }),
      ),
    ).toBeNull();
  });
});

describe("buildDiscogsImageProxySearchParams", () => {
  it("builds cdn and path params from a Discogs image URL", () => {
    const params = buildDiscogsImageProxySearchParams({
      discogsImageUrl: "https://i.discogs.com/example-cover.jpeg",
    });

    expect(params?.get("cdn")).toBe("i");
    expect(params?.get("path")).toBe("/example-cover.jpeg");
    expect(params?.has("url")).toBe(false);
  });
});

describe("isSafeDiscogsResourcePath", () => {
  it("allows normal resource paths", () => {
    expect(isSafeDiscogsResourcePath("/cover.jpg")).toBe(true);
  });
});

describe("fetchDiscogsCdnImage", () => {
  it("fetches from a fixed Discogs CDN origin", async () => {
    global.fetch = jest.fn(async () => new Response()) as typeof fetch;

    await fetchDiscogsCdnImage({
      cdn: "i",
      path: "/example.jpeg",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://i.discogs.com/example.jpeg",
      undefined,
    );
  });
});
