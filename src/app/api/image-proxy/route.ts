import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { logSanitizedApiRouteFailure } from "src/lib/api-helpers";
import {
  fetchDiscogsCdnImage,
  MAX_DISCOGS_IMAGE_URL_LENGTH,
  resolveImageProxyFetchTarget,
} from "src/lib/discogs-image-proxy-url";
import {
  checkIpRateLimit,
  IMAGE_PROXY_RATE_LIMIT_CONFIG,
} from "src/lib/ip-rate-limit";

// Maximum dimensions and file size limits to prevent DoS
const MAX_IMAGE_DIMENSION = 5000;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_QUALITY = 100;
const MIN_QUALITY = 1;

export async function GET(request: NextRequest) {
  const rateLimit = checkIpRateLimit(request, IMAGE_PROXY_RATE_LIMIT_CONFIG);
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const { searchParams } = new URL(request.url);
  const fetchTarget = resolveImageProxyFetchTarget(searchParams);

  if (!fetchTarget) {
    const urlParam = searchParams.get("url");
    if (urlParam && urlParam.length > MAX_DISCOGS_IMAGE_URL_LENGTH) {
      return NextResponse.json(
        { error: "Image URL too long" },
        { status: 400 },
      );
    }

    if (!(urlParam || searchParams.get("path"))) {
      return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Invalid image source" },
      { status: 400 },
    );
  }

  try {
    const response = await fetchDiscogsCdnImage({
      cdn: fetchTarget.cdn,
      path: fetchTarget.path,
      init: {
        headers: {
          "User-Agent": "FilterMyDiscogs/1.0 (https://filtermydiscogs.com)",
        },
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: response.status },
      );
    }

    // Check content length before downloading
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Image file too large" },
        { status: 413 },
      );
    }

    const imageBuffer = await response.arrayBuffer();

    // Validate downloaded image size
    if (imageBuffer.byteLength > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Image file too large" },
        { status: 413 },
      );
    }

    const originalContentType =
      response.headers.get("content-type") || "image/jpeg";

    // Validate and sanitize parameters
    const widthParam = searchParams.get("w");
    const heightParam = searchParams.get("h");
    const qualityParam = searchParams.get("q") || "85";
    const formatParam = searchParams.get("f") || "jpeg";

    // Validate dimensions
    const width = widthParam ? parseInt(widthParam, 10) : undefined;
    const height = heightParam ? parseInt(heightParam, 10) : undefined;

    if (
      width &&
      (Number.isNaN(width) || width < 1 || width > MAX_IMAGE_DIMENSION)
    ) {
      return NextResponse.json(
        { error: `Invalid width (must be 1-${MAX_IMAGE_DIMENSION})` },
        { status: 400 },
      );
    }

    if (
      height &&
      (Number.isNaN(height) || height < 1 || height > MAX_IMAGE_DIMENSION)
    ) {
      return NextResponse.json(
        { error: `Invalid height (must be 1-${MAX_IMAGE_DIMENSION})` },
        { status: 400 },
      );
    }

    // Validate quality
    const quality = Math.max(
      MIN_QUALITY,
      Math.min(MAX_QUALITY, parseInt(qualityParam, 10)),
    );
    if (Number.isNaN(quality)) {
      return NextResponse.json(
        { error: "Invalid quality parameter" },
        { status: 400 },
      );
    }

    // Validate format
    const format = formatParam === "png" ? "png" : "jpeg";

    try {
      let sharpInstance = sharp(Buffer.from(imageBuffer));

      if (width || height) {
        const resizeOptions: {
          width?: number;
          height?: number;
          fit: "cover";
          position: "center";
        } = {
          fit: "cover",
          position: "center",
        };
        if (width) resizeOptions.width = width;
        if (height) resizeOptions.height = height;

        sharpInstance = sharpInstance.resize(resizeOptions);
      }

      let optimizedBuffer: Buffer;
      let contentType: string;

      if (format === "png") {
        optimizedBuffer = await sharpInstance
          .png({
            quality: quality,
            compressionLevel: 9,
            progressive: true,
          })
          .toBuffer();
        contentType = "image/png";
      } else {
        optimizedBuffer = await sharpInstance
          .jpeg({
            quality: quality,
            progressive: true,
            mozjpeg: true,
          })
          .toBuffer();
        contentType = "image/jpeg";
      }

      return new NextResponse(optimizedBuffer as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control":
            "public, max-age=86400, stale-while-revalidate=172800",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch (sharpError) {
      console.error(
        "Sharp optimization failed, returning original image:",
        sharpError,
      );
      return new NextResponse(imageBuffer as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": originalContentType,
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
  } catch (error) {
    const sanitized = logSanitizedApiRouteFailure(
      "/api/image-proxy",
      error,
      "Error proxying image:",
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: sanitized.status },
    );
  }
}
