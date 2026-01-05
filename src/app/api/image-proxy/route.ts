import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

// Maximum dimensions and file size limits to prevent DoS
const MAX_IMAGE_DIMENSION = 5000;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_QUALITY = 100;
const MIN_QUALITY = 1;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  // Validate URL length to prevent extremely long URLs
  if (imageUrl.length > 2048) {
    return NextResponse.json({ error: "Image URL too long" }, { status: 400 });
  }

  try {
    // Validate image URL domain
    if (
      !(
        imageUrl.startsWith("https://i.discogs.com/") ||
        imageUrl.startsWith("https://img.discogs.com/")
      )
    ) {
      return NextResponse.json(
        { error: "Invalid image source" },
        { status: 400 },
      );
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 },
      );
    }

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "FilterMyDiscogs/1.0 (https://filtermydiscogs.com)",
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
    console.error("Error proxying image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
